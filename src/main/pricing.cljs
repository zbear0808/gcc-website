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
(def all-items prices/all-items)

(defn product-by-id [product-id]
  (some #(when (= (:id %) product-id) %) products))

(defn full-build? [{:keys [product]}]
  (= product :full-build))

(defn sanitize-config [config]
  (let [{:keys [shell cable]} config
        selected-shell (some #(when (= (:id %) shell) %) shells)]
    (if (and (= cable :cable-oem)
             (not= (:type selected-shell) :oem))
      (assoc config :cable :cable-3rd-party-3m)
      config)))

(defn calculate-total [config]
  (let [config (sanitize-config config)
        {:keys [product shell buttons rumble cable]} config
        base (or (:price (product-by-id product)) 0)]
    (if (full-build? config)
      (let [active-mods (filterv #(get config (:id %)) mods)
            mods-total (reduce + 0 (mapv :price active-mods))
            selected-shell (some #(when (= (:id %) shell) %) shells)
            shell-price (or (:price selected-shell) 0)
            active-addons (filterv #(get config (:id %)) addons)
            addons-total (reduce + 0 (mapv :price active-addons))
            selected-buttons (some #(when (= (:id %) buttons) %) prices/buttons)
            buttons-price (or (:price selected-buttons) 0)
            selected-rumble (some #(when (= (:id %) rumble) %) rumbles)
            rumble-price (or (:price selected-rumble) 0)
            selected-cable (some #(when (= (:id %) cable) %) cables)
            cable-price (or (:price selected-cable) 0)]
        (+ base mods-total shell-price addons-total buttons-price rumble-price cable-price))
      base)))

(defn get-line-items [config]
  (let [config (sanitize-config config)
        {:keys [product shell buttons rumble cable trigger-plugs? spring-cut? trigger-plug-side]} config
        selected-product (product-by-id product)
        items (transient [])

        ;; Add base product (include shell in name if full build)
        base-name (if (full-build? config)
                    (let [selected-shell (some #(when (= (:id %) shell) %) shells)]
                      (str (:label selected-product) " - " (:label selected-shell) " Shell"))
                    (:label selected-product))
                    
        items (conj! items {:price_data {:currency "usd"
                                         :product_data {:name base-name}
                                         :unit_amount (js/Math.round (* (:price selected-product) 100))}
                            :quantity 1})]
    (if (full-build? config)
      ;; Full build: add mods and addons
      (let [active-mods (filterv #(get config (:id %)) mods)
            items (reduce (fn [acc mod-item]
                            (conj! acc {:price_data {:currency "usd"
                                                     :product_data {:name (:label mod-item)}
                                                     :unit_amount (js/Math.round (* (:price mod-item) 100))}
                                        :quantity 1}))
                          items
                          active-mods)
            
            trigger-side (or trigger-plug-side "both")
            items (cond-> items
                    trigger-plugs?
                    (conj! {:price_data {:currency "usd"
                                         :product_data {:name (str "Trigger Plugs (" (str/upper-case (name trigger-side)) ")")}
                                         :unit_amount 0}
                            :quantity 1})
                    
                    spring-cut?
                    (conj! {:price_data {:currency "usd"
                                         :product_data {:name "Cut Springs"}
                                         :unit_amount 500}
                            :quantity 1}))
            
            items (if-let [selected-buttons (some #(when (= (:id %) buttons) %) prices/buttons)]
                    (conj! items {:price_data {:currency "usd"
                                               :product_data {:name (:label selected-buttons)}
                                               :unit_amount (js/Math.round (* (:price selected-buttons) 100))}
                                  :quantity 1})
                    items)
            
            items (if-let [selected-rumble (some #(when (and (= (:id %) rumble) (> (:price %) 0)) %) rumbles)]
                    (conj! items {:price_data {:currency "usd"
                                               :product_data {:name (:label selected-rumble)}
                                               :unit_amount (js/Math.round (* (:price selected-rumble) 100))}
                                  :quantity 1})
                    items)
            
            items (if-let [selected-cable (some #(when (= (:id %) cable) %) cables)]
                    (conj! items {:price_data {:currency "usd"
                                               :product_data {:name (:label selected-cable)}
                                               :unit_amount (js/Math.round (* (:price selected-cable) 100))}
                                  :quantity 1})
                    items)]
        (persistent! items))
      ;; Board-only or board-kit: just the base line item
      (persistent! items))))

(def individual-items
  (filterv :individual-price (concat addons shells buttons parts rumbles cables)))

(defn calculate-parts-total [cart]
  (reduce (fn [total [part-id quantity]]
            (if-let [part (some #(when (= (:id %) part-id) %) individual-items)]
              (+ total (* (:individual-price part) quantity))
              total))
          0
          cart))

(defn get-parts-line-items [cart]
  (let [items (transient [])
        items (reduce (fn [acc [part-id quantity]]
                        (if (and (> quantity 0) (some #(= (:id %) part-id) individual-items))
                          (let [part (some #(when (= (:id %) part-id) %) individual-items)]
                            (conj! acc {:price_data {:currency "usd"
                                                     :product_data {:name (:label part)}
                                                     :unit_amount (js/Math.round (* (:individual-price part) 100))}
                                        :quantity quantity}))
                          acc))
                      items
                      cart)]
    (persistent! items)))

(def wii-caps
  (filterv #(str/starts-with? (name (:id %)) "wii-cap") parts))

(def other-parts
  (filterv #(not (or (str/starts-with? (name (:id %)) "wii-cap")
                     (= (:id %) :trigger-plugs-parts))) 
           parts))

(def catalog
  [{:id :shells
    :label "Controller Shells"
    :description "Original and third-party controller shells. OEM and Extremerate available."
    :image "/images/parts/shells.png"
    :subtypes shells}
   {:id :buttons
    :label "Custom Buttons"
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
   {:id :trigger-plugs
    :label "Trigger Plugs"
    :description "Trigger plugs for modifying L/R travel."
    :image "/images/addons/trigger-plugs.png"
    :subtypes [(some #(when (= (:id %) :trigger-plugs?) %) addons)
               (some #(when (= (:id %) :trigger-plugs-parts) %) parts)]}
   {:id :cables
    :label "Controller Cables"
    :description "Controller cables and replacements."
    :image "/images/parts/cable-paracord.png"
    :subtypes cables}])

;; We will append individual items that don't have subtypes to the catalog directly
(def full-catalog
  (into catalog
        (mapv (fn [part] (assoc part :subtypes [part])) other-parts)))

(defn get-catalog-item [id]
  (some #(when (= (:id %) id) %) full-catalog))
