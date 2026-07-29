(ns main.pricing
  (:require [clojure.string :as str]
            [main.prices :as prices]))

;; Re-export raw product and pricing data definitions
(def products prices/products)
(def mods prices/mods)
(def addons prices/addons)
(def shells prices/shells)
(def buttons prices/buttons)
(def rumbles prices/rumbles)
(def parts prices/parts)
(def cables prices/cables)
(def slider-pots prices/slider-pots)
(def z-buttons prices/z-buttons)
(def membranes prices/membranes)
(def all-items prices/all-items)

(def item-lookup
  (into {} (map (juxt :id identity) all-items)))

(defn get-item [id]
  (get item-lookup id))

(defn get-item-price [id]
  (or (:price (get-item id)) 0))

(defn product-by-id [product-id]
  (get-item product-id))

(defn full-build? [{:keys [product]}]
  (= product :full-build))

(defn diy-kit? [{:keys [product]}]
  (or (= product :diy-kit) (= product :0-solder-diy-kit)))

(defn sanitize-config [{:keys [product shell buttons rumble cable slider-pots z-button membrane] :as config}]
  (let [config (cond
                 (full-build? config)
                 (assoc config
                        :shell (or shell :white)
                        :buttons (or buttons :oem-buttons)
                        :rumble (or rumble :rumble-none)
                        :cable (or cable :cable-3rd-party-3m)
                        :slider-pots (or slider-pots :slider-pot-alps)
                        :z-button (or z-button :tactile-z)
                        :membrane (or membrane :membrane-extremerate))
                        
                 (diy-kit? config)
                 (assoc config
                        :cable (or cable :cable-3rd-party-3m)
                        :slider-pots (or slider-pots :slider-pot-alps)
                        :z-button (or z-button :tactile-z))
                        
                 :else config)
        new-cable (:cable config)
        selected-shell (get-item (:shell config))]
    (if (and (= new-cable :cable-oem)
             (or (not= (:type selected-shell) :oem)
                 (diy-kit? config)))
      (assoc config :cable :cable-3rd-party-3m)
      config)))

(defn calculate-total [config]
  (let [config (sanitize-config config)
        {:keys [product shell buttons rumble cable slider-pots z-button membrane]} config
        base (get-item-price product)]
    (cond
      (full-build? config)
      (let [active-mods (filterv #(get config (:id %)) mods)
            mods-total (transduce (map :price) + 0 active-mods)
            active-addons (filterv #(get config (:id %)) addons)
            addons-total (transduce (map :price) + 0 active-addons)]
        (+ base mods-total addons-total 
           (get-item-price shell)
           (get-item-price buttons)
           (get-item-price rumble)
           (get-item-price cable)
           (get-item-price slider-pots)
           (get-item-price z-button)
           (get-item-price membrane)))
           
      (diy-kit? config)
      (+ base
         (get-item-price cable)
         (get-item-price slider-pots)
         (get-item-price z-button))
         
      :else
      base)))

(defn create-stripe-line-item [item & [label-override]]
  (let [price (or (:individual-price item) (:price item) 0)]
    (when (> price 0)
      {:price_data {:currency "usd"
                    :product_data {:name (or label-override (:label item))}
                    :unit_amount (js/Math.round (* price 100))}
       :quantity 1})))

(defn get-line-items [config]
  (let [config (sanitize-config config)
        {:keys [product shell buttons rumble cable slider-pots z-button membrane trigger-plugs? spring-cut? trigger-plug-side]} config
        selected-product (get-item product)
        
        ;; Add base product (include shell in name if full build)
        base-name (if (full-build? config)
                    (str (:label selected-product) " - " (:label (get-item shell)) " Shell")
                    (:label selected-product))
                    
        items (cond-> []
                true (conj (create-stripe-line-item selected-product base-name)))]
                
    (cond
      (full-build? config)
      ;; Full build: add mods and addons
      (let [active-mods (filterv #(get config (:id %)) mods)
            active-addons (filterv #(get config (:id %)) addons)
            
            trigger-side (or trigger-plug-side :both)
            trigger-label (str "Trigger Plugs (" (str/upper-case (name trigger-side)) ")")
            
            items (-> items
                      (into (keep #(create-stripe-line-item %) active-mods))
                      (into (keep (fn [addon]
                                    (if (= (:id addon) :trigger-plugs?)
                                      (create-stripe-line-item addon trigger-label)
                                      (create-stripe-line-item addon)))
                                  active-addons))
                      (cond->
                        buttons (conj (create-stripe-line-item (get-item buttons)))
                        rumble (conj (create-stripe-line-item (get-item rumble)))
                        cable (conj (create-stripe-line-item (get-item cable)))
                        slider-pots (conj (create-stripe-line-item (get-item slider-pots)))
                        z-button (conj (create-stripe-line-item (get-item z-button)))
                        membrane (conj (create-stripe-line-item (get-item membrane)))))]
        ;; Filter out any nil items (e.g. price 0)
        (filterv some? items))
        
      (diy-kit? config)
      (let [items (-> items
                      (cond->
                        cable (conj (create-stripe-line-item (get-item cable)))
                        slider-pots (conj (create-stripe-line-item (get-item slider-pots)))
                        z-button (conj (create-stripe-line-item (get-item z-button)))))]
        (filterv some? items))
      
      :else
      ;; Board-only: just the base line item
      items)))

(def individual-items
  (filterv :individual-price (concat addons shells buttons parts rumbles cables slider-pots z-buttons membranes)))

(def individual-item-lookup
  (into {} (map (juxt :id identity) individual-items)))

(defn calculate-parts-total [cart]
  (reduce (fn [total [part-id quantity]]
            (if-let [part (get individual-item-lookup (keyword part-id))]
              (+ total (* (:individual-price part) quantity))
              total))
          0
          cart))

(defn get-parts-line-items [cart]
  (let [items (reduce (fn [acc [part-id quantity]]
                        (if (> quantity 0)
                          (if-let [part (get individual-item-lookup (keyword part-id))]
                            (conj acc (assoc (create-stripe-line-item part) :quantity quantity))
                            acc)
                          acc))
                      []
                      cart)]
    items))

(def wii-caps
  (filterv #(str/starts-with? (name (:id %)) "wii-cap") parts))

(def other-parts
  (filterv #(not (str/starts-with? (name (:id %)) "wii-cap")) 
           parts))

(def catalog
  [{:id :shells
    :label "Controller Shells"
    :description "Original and third-party controller shells. OEM and Extremerate available."
    :image "/images/parts/shells.png"
    :subtypes shells}
   {:id :buttons
    :label "Buttons"
    :description "Replacement buttons for your controller."
    :image "/images/parts/buttons.png"
    :subtypes buttons}
   {:id :wii-caps
    :label "OEM Wii Classic Stick Caps"
    :description "Replacement stick caps in various conditions."
    :image "/images/parts/wii-caps.png"
    :subtypes wii-caps}
   {:id :rumble-motors
    :label "Rumble Motors"
    :description "Rumble motors for your controller."
    :image "/images/parts/rumble-motors.png"
    :subtypes (filterv #(not= (:id %) :rumble-none) rumbles)}
   {:id :cables
    :label "Controller Cables"
    :description "Controller cables and replacements."
    :image "/images/parts/cable-paracord.png"
    :subtypes cables}
   {:id :slider-pots
    :label "Slider Potentiometers"
    :description "Replacement slide potentiometers for triggers."
    :image "/images/parts/slider-pot.png"
    :subtypes slider-pots}
   {:id :z-buttons
    :label "Z Buttons"
    :description "Tactile or OEM Z Buttons."
    :image "/images/parts/tactile-z.png"
    :subtypes z-buttons}
   {:id :membranes
    :label "Rubber Membranes"
    :description "Rubber membranes for the A, B, X, Y, Start, and D-Pad buttons."
    :image "/images/parts/membrane-clear.png"
    :subtypes membranes}])

;; We will append individual items that don't have subtypes to the catalog directly
(def full-catalog
  (into catalog
        (mapv (fn [part] (assoc part :subtypes [part])) other-parts)))

(defn get-catalog-item [id]
  (some #(when (= (:id %) id) %) full-catalog))
