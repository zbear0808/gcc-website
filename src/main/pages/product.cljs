(ns main.pages.product
  (:require
    ["react-router-dom" :refer [useParams useNavigate]]
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [helix.hooks :as hooks]
    [main.pricing :as pricing]
    [clojure.string :as str]))

(defnc product-page [{:keys [cart set-cart inventory]}]
  (let [params (useParams)
        id-str (.-id params)
        product-id (keyword id-str)
        product (pricing/get-catalog-item product-id)
        navigate (useNavigate)
        
        [selected-subtype-id set-selected-subtype-id] (hooks/use-state 
                                                        (when product 
                                                          (:id (first (:subtypes product)))))
        
        ;; Use effect to update subtype if product changes or on initial mount if state is nil
        _ (hooks/use-effect [product]
            (when (and product (not selected-subtype-id))
              (set-selected-subtype-id (:id (first (:subtypes product))))))
        
        get-stock (fn [item-id] (get inventory item-id 0))
        
        selected-subtype (first (filter #(= (:id %) selected-subtype-id) (:subtypes product)))
        
        stock (get-stock selected-subtype-id)
        quantity-in-cart (get cart selected-subtype-id 0)
        
        handle-add-to-cart (fn []
                             (set-cart (fn [prev]
                                         (assoc prev selected-subtype-id (inc quantity-in-cart)))))
                                         
        handle-remove-from-cart (fn []
                                  (set-cart (fn [prev]
                                              (let [new-val (max 0 (dec quantity-in-cart))]
                                                (assoc prev selected-subtype-id new-val)))))]
                                                
    (if-not product
      (d/div {:class "page"}
             (d/h2 "Product not found"))
      (d/div
        {:class "page product-page"}
        (d/div {:style {:display "flex" :gap "40px" :max-width "1000px" :margin "0 auto" :flex-wrap "wrap"}}
               ;; Left side - Image
               (d/div {:style {:flex "1" :min-width "300px" :display "flex" :justify-content "center" :align-items "flex-start"}}
                      (if (:image product)
                        (d/img {:src (:image product) :alt (:label product) :style {:max-width "100%" :border-radius "8px" :box-shadow "0 4px 12px rgba(0,0,0,0.1)"}})
                        (d/div {:style {:width "100%" :aspect-ratio "1" :background "var(--bg-secondary)" :border-radius "8px" :display "flex" :align-items "center" :justify-content "center"}}
                               "No image available")))
               
               ;; Right side - Details
               (d/div {:style {:flex "1" :min-width "300px" :display "flex" :flex-direction "column" :gap "20px"}}
                      (d/h1 {:style {:margin "0"}} (:label product))
                      (d/p {:style {:font-size "1.1em" :color "var(--text-muted)" :margin "0"}} (:description product))
                      
                      (if (> (count (:subtypes product)) 1)
                        (d/div {:class "config-section" :style {:margin-top "20px"}}
                               (d/h3 {:style {:margin-bottom "10px" :font-size "1em"}} "Select Option:")
                               (d/select {:value (name selected-subtype-id)
                                          :on-change #(set-selected-subtype-id (keyword (.. % -target -value)))
                                          :style {:width "100%" :padding "10px" :border-radius "4px" :border "1px solid var(--border-color)" :background "var(--bg-color)" :color "var(--text-color)" :font-size "1em"}}
                                         (for [subtype (:subtypes product)]
                                           (d/option {:key (name (:id subtype)) :value (name (:id subtype))}
                                                     (str (:label subtype) " - $" (or (:individual-price subtype) (:price subtype)))))))
                        
                        ;; Only one subtype, just show its price
                        (d/div {:style {:font-size "1.5em" :font-weight "bold" :margin-top "10px"}}
                               (str "$" (or (:individual-price selected-subtype) (:price selected-subtype)))))
                               
                      (d/div {:style {:margin-top "20px" :padding "20px" :background "var(--bg-secondary)" :border-radius "8px" :display "flex" :flex-direction "column" :gap "15px"}}
                             (if (<= stock 0)
                               (d/div {:style {:color "red" :font-weight "bold"}} "Out of Stock")
                               (d/div
                                 (d/div {:style {:margin-bottom "15px" :color "var(--text-muted)"}} (str stock " in stock"))
                                 (if (> quantity-in-cart 0)
                                   (d/div {:style {:display "flex" :align-items "center" :gap "15px"}}
                                          (d/button {:on-click handle-remove-from-cart
                                                     :style {:width "40px" :height "40px" :border-radius "50%" :border "1px solid var(--border-color)" :background "var(--bg-color)" :color "var(--text-color)" :cursor "pointer" :font-size "1.2em"}} "-")
                                          (d/span {:style {:font-size "1.2em" :min-width "20px" :text-align "center"}} quantity-in-cart)
                                          (d/button {:on-click handle-add-to-cart
                                                     :disabled (>= quantity-in-cart stock)
                                                     :style {:width "40px" :height "40px" :border-radius "50%" :border "1px solid var(--border-color)" :background "var(--bg-color)" :color "var(--text-color)" :cursor "pointer" :font-size "1.2em"}} "+"))
                                   (d/button {:on-click handle-add-to-cart
                                              :class "checkout-btn"
                                              :style {:width "100%"}} "Add to Cart")))))
                      
                      (d/button {:on-click #(navigate "/parts")
                                 :style {:background "none" :border "none" :color "var(--accent-color)" :cursor "pointer" :text-align "left" :padding "0" :margin-top "20px"}}
                                "← Back to Parts")))))))
