(ns main.pages.parts
  (:require
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [helix.hooks :as hooks]
    [main.pricing :as pricing]))

(defnc parts-page []
  (let [[cart set-cart] (hooks/use-state {})
        [loading? set-loading] (hooks/use-state false)
        
        update-quantity (fn [part-id delta]
                          (set-cart (fn [prev]
                                      (let [current (get prev part-id 0)
                                            new-val (max 0 (+ current delta))]
                                        (assoc prev part-id new-val)))))
                                        
        total-price (pricing/calculate-parts-total cart)
        
        handle-checkout (fn []
                          (if (= total-price 0)
                            (js/alert "Your cart is empty.")
                            (do
                              (set-loading true)
                              (-> (js/fetch "http://localhost:3000/create-checkout-session"
                                            #js {:method "POST"
                                                 :headers #js {"Content-Type" "application/json"}
                                                 :body (js/JSON.stringify (clj->js {:is-parts true :cart cart}))})
                                  (.then (fn [res]
                                           (if (.-ok res)
                                             (.json res)
                                             (throw (js/Error. "Failed to create checkout session")))))
                                  (.then (fn [data]
                                           (set! (.-href js/window.location) (.-url data))))
                                  (.catch (fn [err]
                                            (js/console.error err)
                                            (set-loading false)
                                            (js/alert "Checkout failed. Is the backend running?")))))))]
    
    (d/div
      {:class "page shop-page"}
      (d/div
        {:class "shop-grid" :style {:display "block"}}
        (d/div
          {:class "config-panel" :style {:max-width "800px" :margin "0 auto"}}
          (d/h2 {:style {:margin-bottom "20px" :text-align "center"}} "Individual Parts")
          (d/div {:class "config-section"}
                 (d/div {:class "config-options product-options" :style {:display "flex" :flex-direction "column" :gap "15px"}}
                        (map (fn [{:keys [id label price description]}]
                               (let [quantity (get cart id 0)]
                                 (d/div
                                   {:key (name id)
                                    :class "toggle-btn"
                                    :style {:display "flex" :justify-content "space-between" :align-items "center" :padding "15px" :cursor "default"}}
                                   (d/div
                                     (d/span {:class "product-label" :style {:font-size "1.1em"}} label)
                                     (d/span {:class "product-price" :style {:display "block" :color "var(--text-muted)"}} (str "$" price))
                                     (when description
                                       (d/span {:class "product-desc" :style {:display "block" :font-size "0.9em" :color "var(--text-muted)" :margin-top "5px"}} description)))
                                   (d/div {:style {:display "flex" :align-items "center" :gap "15px"}}
                                          (d/button {:on-click #(update-quantity id -1)
                                                     :style {:width "30px" :height "30px" :border-radius "50%" :border "1px solid var(--border-color)" :background "transparent" :color "var(--text-color)" :cursor "pointer"}} "-")
                                          (d/span {:style {:font-size "1.2em" :min-width "20px" :text-align "center"}} quantity)
                                          (d/button {:on-click #(update-quantity id 1)
                                                     :style {:width "30px" :height "30px" :border-radius "50%" :border "1px solid var(--border-color)" :background "transparent" :color "var(--text-color)" :cursor "pointer"}} "+")))))
                             pricing/parts)))
          
          (d/div
            {:class "price-box" :style {:margin-top "30px"}}
            (d/div {:class "price-total"}
                   (d/span "Total")
                   (d/span (str "$" total-price)))
            (d/button {:class "checkout-btn" 
                       :on-click handle-checkout
                       :disabled (or loading? (= total-price 0))} 
                      (if loading? "Loading..." "Checkout"))))))))
