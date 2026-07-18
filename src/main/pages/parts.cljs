(ns main.pages.parts
  (:require
    ["react-router-dom" :refer [useNavigate]]
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [helix.hooks :as hooks]
    [main.pricing :as pricing]))

(defnc parts-page [{:keys [cart set-cart inventory]}]
  (let [navigate (useNavigate)
        get-stock (fn [item-id] (get inventory item-id 0))
        out-of-stock? (fn [item-id] (<= (get-stock item-id) 0))
        
        update-quantity (fn [part-id delta]
                          (set-cart (fn [prev]
                                      (let [current (get prev part-id 0)
                                            new-val (max 0 (+ current delta))
                                            stock (get-stock part-id)
                                            capped-val (min new-val stock)]
                                        (assoc prev part-id capped-val)))))
                                        
        render-item (fn [{:keys [id label description image subtypes] :as product}]
                      (let [price-to-show (if (= 1 (count subtypes))
                                            (or (:individual-price (first subtypes)) (:price (first subtypes)))
                                            (str "From $" (apply min (map #(or (:individual-price %) (:price %)) subtypes))))
                            ;; For a single subtype, we could show stock, but since we link to the product page anyway, we can keep it simple
                            ]
                        (d/div
                          {:key (name id)
                           :class "toggle-btn"
                           :on-click #(navigate (str "/product/" (name id)))
                           :style {:display "flex" :justify-content "flex-start" :align-items "center" :padding "15px" :cursor "pointer" :gap "20px"}}
                          (if image
                            (d/img {:src image :alt label :style {:width "80px" :height "80px" :object-fit "cover" :border-radius "4px"}})
                            (d/div {:style {:width "80px" :height "80px" :background "var(--bg-secondary)" :border-radius "4px"}}))
                          (d/div {:style {:flex "1"}}
                            (d/span {:class "product-label" :style {:font-size "1.1em"}} label)
                            (d/span {:class "product-price" :style {:display "block" :color "var(--text-muted)"}} (str price-to-show))
                            (when description
                              (d/span {:class "product-desc" :style {:display "block" :font-size "0.9em" :color "var(--text-muted)" :margin-top "5px"}} description))))))
                                            
        total-price (pricing/calculate-parts-total cart)]
    
    (d/div
      {:class "page shop-page"}
      (d/div
        {:class "shop-grid" :style {:display "block"}}
        (d/div
          {:class "config-panel" :style {:max-width "800px" :margin "0 auto"}}
          (d/h2 {:style {:margin-bottom "20px" :text-align "center"}} "Individual Parts")
          
          (d/div {:class "config-section" :style {:margin-bottom "30px"}}
                 (d/div {:class "config-options product-options" :style {:display "grid" :grid-template-columns "1fr 1fr" :gap "15px"}}
                        (map render-item pricing/full-catalog)))
          
          (d/div
            {:class "price-box" :style {:margin-top "30px"}}
            (d/div {:class "price-total"}
                   (d/span "Total")
                   (d/span (str "$" total-price)))
            (d/button {:class "checkout-btn" 
                       :on-click #(navigate "/cart")} 
                      "View Cart")))))))
