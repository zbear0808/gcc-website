(ns main.pricing
  (:require [clojure.string :as str]))
(def products
  [{:id :board-only
    :label "PhobGCC Board Only"
    :description "Just the board — no attachments, no shell."
    :price 25
    :image "/images/products/board-only.png"}
   {:id :diy-kit
    :label "DIY Kit"
    :description "Board with slider pots, T3 stickboxes (magnet mounts), tactile Z button, GCC cable, notch ruler, and trigger plug. THIS IS FOR DIY, parts do not come soldered on"
    :price 75
    :image "/images/products/diy-kit.png"}
   {:id :full-build
    :label "PhobGCC Full Build"
    :description "Complete controller with T3 stickboxes — choose your shell and mods."
    :price 150
    :image "/images/products/full-build.png"}])

(def mods
  [{:id :notches-firefox? :label "Firefox Notches" :price 40 :image "/images/mods/firefox.png"}
   {:id :notches-wavedash? :label "Wavedash Notches" :price 20 :image "/images/mods/wavedash.png"}])

(def addons
  [{:id :trigger-plugs? :label "Trigger Plugs" :price 0 :individual-price 10 :image "/images/addons/trigger-plugs.png"}
   {:id :spring-cut? :label "Cut Springs" :price 5 :image "/images/addons/cut-springs.png"}])

(def shells
  [{:id :cherry :label "Cherry Blossom" :type :extremerate :price 0 :individual-price 35 :image "/images/shells/cherry.png"}
   {:id :white :label "White" :type :extremerate :price 0 :individual-price 35 :image "/images/shells/white.png"}
   {:id :clear :label "Clear" :type :extremerate :price 0 :individual-price 35 :image "/images/shells/clear.png"}
   {:id :indigo :label "Indigo" :type :oem :price 0 :individual-price 25 :image "/images/shells/indigo.png"}
   {:id :black :label "Black" :type :oem :price 0 :individual-price 25 :image "/images/shells/black.png"}
   {:id :orange :label "Spice Orange" :type :oem :price 0 :individual-price 25 :image "/images/shells/orange.png"}
   {:id :emerald :label "Emerald Blue" :type :oem :price 0 :individual-price 25 :image "/images/shells/emerald.png"}])

(def buttons
  [{:id :oem-buttons :label "OEM Buttons" :price 0 :individual-price 15 :image "/images/buttons/oem.png"}
   {:id :white-buttons :label "White Buttons" :price 0 :individual-price 18 :image "/images/buttons/white.png"}
   {:id :chrome-buttons :label "Chrome Buttons" :price 0 :individual-price 18 :image "/images/buttons/chrome.png"}])

(def rumbles
  [{:id :rumble-none :label "No Rumble Motor" :price 0 :image "/images/parts/rumble-none.png"}
   {:id :rumble-oem :label "OEM Rumble Motor" :price 4 :individual-price 10 :image "/images/parts/rumble-oem.png"}
   {:id :rumble-non-oem :label "Non-OEM Rumble Motor" :price 1 :individual-price 1 :image "/images/parts/rumble-non-oem.png"}])

(defn product-by-id [product-id]
  (first (filter #(= (:id %) product-id) products)))

(defn full-build? [config]
  (= (:product config) :full-build))

(defn calculate-total [config]
  (let [{:keys [product]} config
        base (or (:price (product-by-id product)) 0)]
    (if (full-build? config)
      (let [active-mods (filter #(get config (:id %)) mods)
            mods-total (reduce + 0 (mapv :price active-mods))
            selected-shell (first (filter #(= (:id %) (:shell config)) shells))
            shell-price (or (:price selected-shell) 0)
        active-addons (filter #(get config (:id %)) addons)
            addons-total (reduce + 0 (mapv :price active-addons))
            selected-buttons (first (filter #(= (:id %) (:buttons config)) buttons))
            buttons-price (or (:price selected-buttons) 0)
            selected-rumble (first (filter #(= (:id %) (:rumble config)) rumbles))
            rumble-price (or (:price selected-rumble) 0)]
        (+ base mods-total shell-price addons-total buttons-price rumble-price))
      base)))

(defn get-line-items [config]
  (let [{:keys [product]} config
        selected-product (product-by-id product)
        items (transient [])

        ;; Add base product (include shell in name if full build)
        base-name (if (full-build? config)
                    (let [selected-shell (first (filter #(= (:id %) (:shell config)) shells))]
                      (str (:label selected-product) " - " (:label selected-shell) " Shell"))
                    (:label selected-product))
                    
        items (conj! items {:price_data {:currency "usd"
                                         :product_data {:name base-name}
                                         :unit_amount (* (:price selected-product) 100)}
                            :quantity 1})]
    (if (full-build? config)
      ;; Full build: add mods and addons
      (let [active-mods (filter #(get config (:id %)) mods)
            items (reduce (fn [acc mod-item]
                            (conj! acc {:price_data {:currency "usd"
                                                     :product_data {:name (:label mod-item)}
                                                     :unit_amount (* (:price mod-item) 100)}
                                        :quantity 1}))
                          items
                          active-mods)
            
            trigger-plugs? (:trigger-plugs? config)
            spring-cut? (:spring-cut? config)
            trigger-side (or (:trigger-plug-side config) "both")
            
            items (let [acc items
                        acc (if trigger-plugs?
                              (conj! acc {:price_data {:currency "usd"
                                                       :product_data {:name (str "Trigger Plugs (" (str/upper-case (name trigger-side)) ")")}
                                                       :unit_amount 0}
                                          :quantity 1})
                              acc)
                        acc (if spring-cut?
                              (conj! acc {:price_data {:currency "usd"
                                                       :product_data {:name "Cut Springs"}
                                                       :unit_amount 500}
                                          :quantity 1})
                              acc)]
                    acc)
            
            items (if-let [selected-buttons (first (filter #(= (:id %) (:buttons config)) buttons))]
                    (conj! items {:price_data {:currency "usd"
                                               :product_data {:name (:label selected-buttons)}
                                               :unit_amount (* (:price selected-buttons) 100)}
                                  :quantity 1})
                    items)
            
            items (if-let [selected-rumble (first (filter #(and (= (:id %) (:rumble config)) (> (:price %) 0)) rumbles))]
                    (conj! items {:price_data {:currency "usd"
                                               :product_data {:name (:label selected-rumble)}
                                               :unit_amount (* (:price selected-rumble) 100)}
                                  :quantity 1})
                    items)]
        (persistent! items))
      ;; Board-only or board-kit: just the base line item
      (persistent! items))))

(def parts
  [{:id :slider-pot :label "Slider Potentiometers (Pack of 2)" :description "Replacement slide potentiometers for triggers." :price 10 :individual-price 12 :image "/images/parts/slider-pot.png"}
   {:id :notch-ruler :label "Notch Ruler" :description "Guide tool to help with creating firefox and wavedash notches." :price 1 :individual-price 2 :image "/images/parts/notch-ruler.png"}
   {:id :stickbox :label "Stickboxes (Pack of 2)" :description "Replacement stickboxes for analog sticks." :price 10 :individual-price 12 :image "/images/parts/stickbox.png"}
   {:id :stickbox-pot :label "Stickbox Potentiometers UNTESTED (Pack of 8)" :description "Untested potentiometers for stickboxes." :price 1 :individual-price 2 :image "/images/parts/stickbox-pot.png"}
   {:id :tactile-z :label "Tactile Z Button" :description "Tactile switch for the Z button." :price 1 :individual-price 2 :image "/images/parts/tactile-z.png"}
   {:id :wii-cap-new :label "OEM Wii Classic Stick Cap (New)" :description "OEM stick cap in like-new condition." :price 4 :individual-price 5 :image "/images/parts/wii-cap-new.png"}
   {:id :wii-cap-okay :label "OEM Wii Classic Stick Cap (Okay)" :description "OEM stick cap in okay condition." :price 2 :individual-price 3 :image "/images/parts/wii-cap-okay.png"}
   {:id :wii-cap-poor :label "OEM Wii Classic Stick Cap (Poor)" :description "OEM stick cap in poor condition." :price 1 :individual-price 2 :image "/images/parts/wii-cap-poor.png"}
   {:id :magnet-mount :label "Magnet Mounts (Pack of 4)" :description "Mounts for magnets used with Hall effect sensors." :price 1 :individual-price 2 :image "/images/parts/magnet-mount.png"}
   {:id :dh1212-magnet :label "DH1212 Magnets (Pack of 4)" :description "Magnets for use with Hall effect sensors." :price 1 :individual-price 2 :image "/images/parts/dh1212-magnet.png"}
   {:id :6-pin-ribbon-cable :label "6 pin ribbon cable" :description "Ribbon cable for connecting the main board to the C stick daughter board." :price 1 :individual-price 2 :image "/images/parts/ribbon-cable.png"}
   {:id :trigger-paddle-pcbs :label "Trigger Paddle PCBs (Pack of 2)" :description "PCBs for custom trigger paddles." :price 1 :individual-price 2 :image "/images/parts/trigger-paddle.png"}
   {:id :trigger-plugs-parts :label "Trigger Plugs (Pack of 2)" :description "Plugs for reducing trigger travel distance." :price 1 :individual-price 2 :image "/images/parts/trigger-plugs-parts.png"}])

(def individual-items
  (filterv :individual-price (concat addons shells buttons parts rumbles)))

(defn calculate-parts-total [cart]
  (reduce (fn [total [part-id quantity]]
            (if-let [part (first (filter #(= (:id %) part-id) individual-items))]
              (+ total (* (:individual-price part) quantity))
              total))
          0
          cart))

(defn get-parts-line-items [cart]
  (let [items (transient [])
        items (reduce (fn [acc [part-id quantity]]
                        (if (and (> quantity 0) (some #(= (:id %) part-id) individual-items))
                          (let [part (first (filter #(= (:id %) part-id) individual-items))]
                            (conj! acc {:price_data {:currency "usd"
                                                     :product_data {:name (:label part)}
                                                     :unit_amount (* (:individual-price part) 100)}
                                        :quantity quantity}))
                          acc))
                      items
                      cart)]
    (persistent! items)))

(def wii-caps
  (filter #(str/starts-with? (name (:id %)) "wii-cap") parts))

(def other-parts
  (remove #(or (str/starts-with? (name (:id %)) "wii-cap")
               (= (:id %) :trigger-plugs-parts)) 
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
    :subtypes (remove #(= (:id %) :rumble-none) rumbles)}
   {:id :trigger-plugs
    :label "Trigger Plugs"
    :description "Trigger plugs for modifying L/R travel."
    :image "/images/addons/trigger-plugs.png"
    :subtypes [(first (filter #(= (:id %) :trigger-plugs?) addons))
               (first (filter #(= (:id %) :trigger-plugs-parts) parts))]}])

;; We will append individual items that don't have subtypes to the catalog directly
(def full-catalog
  (concat catalog
          (map (fn [part] (assoc part :subtypes [part])) other-parts)))

(defn get-catalog-item [id]
  (first (filter #(= (:id %) id) full-catalog)))
