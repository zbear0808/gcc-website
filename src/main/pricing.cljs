(ns main.pricing)

(def products
  [{:id :board-only
    :label "PhobGCC Board Only"
    :description "Just the board — no attachments, no shell."
    :price 25}
   {:id :diy-kit
    :label "DIY Kit"
    :description "Board with slider pots, T3 stickboxes (magnet mounts), tactile Z button, GCC cable, notch ruler, and trigger plug. THIS IS FOR DIY, parts do not come soldered on"
    :price 75}
   {:id :full-build
    :label "PhobGCC Full Build"
    :description "Complete controller with T3 stickboxes — choose your shell and mods."
    :price 150}])

(def mods
  [{:id :notches-firefox? :label "Firefox Notches" :price 40}
   {:id :notches-wavedash? :label "Wavedash Notches" :price 20}])

(def addons
  [{:id :trigger-plugs? :label "Trigger Plugs" :price 8}
   {:id :spring-cut? :label "Cut Springs" :price 5}])

(def shells
  [{:id :cherry :label "Cherry Blossom" :price 0}
   {:id :white :label "White" :price 0}
   {:id :clear :label "Clear" :price 0}])

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
            addons-total (if (and (:trigger-plugs? config) (:spring-cut? config))
                           10
                           (reduce + 0 (mapv :price active-addons)))]
        (+ base mods-total shell-price addons-total))
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
            
            items (if (and trigger-plugs? spring-cut?)
                    (conj! items {:price_data {:currency "usd"
                                               :product_data {:name (str "Trigger Plugs (" (clojure.string/upper-case (name trigger-side)) ") & Cut Springs")}
                                               :unit_amount 1000}
                                  :quantity 1})
                    (let [acc items
                          acc (if trigger-plugs?
                                (conj! acc {:price_data {:currency "usd"
                                                         :product_data {:name (str "Trigger Plugs (" (clojure.string/upper-case (name trigger-side)) ")")}
                                                         :unit_amount 800}
                                            :quantity 1})
                                acc)
                          acc (if spring-cut?
                                (conj! acc {:price_data {:currency "usd"
                                                         :product_data {:name "Cut Springs"}
                                                         :unit_amount 500}
                                            :quantity 1})
                                acc)]
                      acc))]
        (persistent! items))
      ;; Board-only or board-kit: just the base line item
      (persistent! items))))

(def parts
  [{:id :slider-pot :label "Slider Potentiometers (Pack of 2)" :price 10}
   {:id :notch-ruler :label "Notch Ruler" :price 1}
   {:id :stickbox :label "Stickboxes (Pack of 2)" :price 10}
   {:id :stickbox-pot :label "Stickbox Potentiometer (Untested)" :price 1}
   {:id :tactile-z :label "Tactile Z Button" :price 1}
   {:id :wii-cap :label "Wii Classic Stick Cap" :price 4}
   {:id :magnet-mount :label "Magnet Mounts (Pack of 4)" :price 1}
   {:id :dh1212-magnet :label "DH1212 Magnets (Pack of 4)" :price 1}
   {:id :6-pin-ribbon-cable :label "6 pin ribbon cable" :description "ribbon cable for connecting the main board to the C stick sub board" :price 1}])

(defn calculate-parts-total [cart]
  (reduce (fn [total [part-id quantity]]
            (if-let [part (first (filter #(= (:id %) part-id) parts))]
              (+ total (* (:price part) quantity))
              total))
          0
          cart))

(defn get-parts-line-items [cart]
  (let [items (transient [])
        items (reduce (fn [acc [part-id quantity]]
                        (if (and (> quantity 0) (some #(= (:id %) part-id) parts))
                          (let [part (first (filter #(= (:id %) part-id) parts))]
                            (conj! acc {:price_data {:currency "usd"
                                                     :product_data {:name (:label part)}
                                                     :unit_amount (* (:price part) 100)}
                                        :quantity quantity}))
                          acc))
                      items
                      cart)]
    (persistent! items)))
