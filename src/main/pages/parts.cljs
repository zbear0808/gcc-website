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
                                        
        total-price (pricing/calculate-parts-total cart)]
    
    (d/div
      {:class "page shop-page"}
      (d/div
        {:class "shop-grid" :style {:display "block"}}
        (d/div
          {:class "config-panel" :style {:max-width "800px" :margin "0 auto"}}
          (d/h2 {:style {:margin-bottom "20px" :text-align "center"}} "Individual Parts")
          (d/div {:class "config-section"}
                 (d/div {:class "config-options product-options" :style {:display "flex" :flex-direction "column" :gap "15px"}}
                        (map (fn [{:keys [id label individual-price price description]}]
                               (let [quantity (get cart id 0)
                                     stock (get-stock id)
                                     oos? (out-of-stock? id)
                                     price-to-show (or individual-price price)]
                                 (d/div
                                   {:key (name id)
                                    :class "toggle-btn"
                                    :style {:display "flex" :justify-content "space-between" :align-items "center" :padding "15px" :cursor "default"}}
                                   (d/div
                                     (d/span {:class "product-label" :style {:font-size "1.1em"}} label)
                                     (d/span {:class "product-price" :style {:display "block" :color "var(--text-muted)"}} (str "$" price-to-show))
                                     (if oos?
                                       (d/span {:style {:display "block" :color "var(--primary-color)" :font-size "0.8em" :margin-top "5px"}} "Out of Stock")
                                       (d/span {:style {:display "block" :color "var(--text-muted)" :font-size "0.8em" :margin-top "5px"}} (str stock " in stock")))
                                     (when description
                                       (d/span {:class "product-desc" :style {:display "block" :font-size "0.9em" :color "var(--text-muted)" :margin-top "5px"}} description)))
                                   (d/div {:style {:display "flex" :align-items "center" :gap "15px"}}
                                          (d/button {:on-click #(update-quantity id -1)
                                                     :disabled (<= quantity 0)
                                                     :style {:width "30px" :height "30px" :border-radius "50%" :border "1px solid var(--border-color)" :background "transparent" :color "var(--text-color)" :cursor "pointer"}} "-")
                                          (d/span {:style {:font-size "1.2em" :min-width "20px" :text-align "center"}} quantity)
                                          (d/button {:on-click #(update-quantity id 1)
                                                     :disabled (>= quantity stock)
                                                     :style {:width "30px" :height "30px" :border-radius "50%" :border "1px solid var(--border-color)" :background "transparent" :color "var(--text-color)" :cursor "pointer"}} "+")))))
                             pricing/individual-items)))
          
          (d/div
            {:class "price-box" :style {:margin-top "30px"}}
            (d/div {:class "price-total"}
                   (d/span "Total")
                   (d/span (str "$" total-price)))
            (d/button {:class "checkout-btn" 
                       :on-click #(navigate "/cart")} 
                      "View Cart")))))))
