(ns main.pricing)

(def base-price 200)

(def mods
  [{:id :notches-firefox? :label "Firefox Notches" :price 40}
   {:id :notches-wavedash? :label "Wavedash Notches" :price 40}
   {:id :paracord? :label "Paracord Cable" :price 35}
   {:id :buttons-custom? :label "Custom Resin Buttons" :price 20}
   {:id :trigger-plugs? :label "Trigger Plugs" :price 8}])

(def shells
  [{:id :oem :label "OEM (None)" :price 0}
   {:id :cherry :label "Cherry Blossom" :price 25}
   {:id :white :label "White" :price 25}
   {:id :black :label "Black" :price 25}
   {:id :clear :label "Clear" :price 25}])

(defn calculate-total [config]
  (let [active-mods (filter #(get config (:id %)) mods)
        mods-total (reduce + 0 (map :price active-mods))
        selected-shell (first (filter #(= (:id %) (:shell config)) shells))
        shell-price (or (:price selected-shell) 0)]
    (+ base-price mods-total shell-price)))

(defn get-line-items [config]
  (let [items (transient [])
        
        ;; Add Base Controller
        items (conj! items {:price_data {:currency "usd"
                                         :product_data {:name "PhobGCC Base Controller (T3 Stickboxes)"}
                                         :unit_amount (* base-price 100)}
                            :quantity 1})
        
        ;; Add Shell
        selected-shell (first (filter #(= (:id %) (:shell config)) shells))
        items (if (and selected-shell (> (:price selected-shell) 0))
                (conj! items {:price_data {:currency "usd"
                                           :product_data {:name (str (:label selected-shell) " Shell")}
                                           :unit_amount (* (:price selected-shell) 100)}
                              :quantity 1})
                items)
        
        ;; Add Mods
        active-mods (filter #(get config (:id %)) mods)
        items (reduce (fn [acc mod-item]
                        (conj! acc {:price_data {:currency "usd"
                                                 :product_data {:name (:label mod-item)}
                                                 :unit_amount (* (:price mod-item) 100)}
                                    :quantity 1}))
                      items
                      active-mods)]
    (persistent! items)))
