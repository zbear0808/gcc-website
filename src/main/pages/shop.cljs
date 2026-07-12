(ns main.pages.shop
  (:require
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [helix.hooks :as hooks]
    [clojure.string :as str]
    [main.pricing :as pricing]))

(def initial-state
  {:product :full-build
   :shell :cherry
   :buttons :oem-buttons
   :notches-firefox? false
   :notches-wavedash? false
   :trigger-plugs? false
   :trigger-plug-side :both
   :spring-cut? false})

(defnc visualizer [{:keys [config]}]
  (let [{:keys [shell notches-firefox? notches-wavedash? trigger-plugs? trigger-plug-side]} config
        full-build? (pricing/full-build? config)]
    (d/div
      {:class "visualizer-wrapper"}
      (d/div
        {:class "controller-map"}
        
        ;; Triggers
        (d/div {:class (str "trigger trigger-l " (when (and full-build? trigger-plugs? (or (= trigger-plug-side :both) (= trigger-plug-side :l))) "has-plugs"))})
        (d/div {:class (str "trigger trigger-r " (when (and full-build? trigger-plugs? (or (= trigger-plug-side :both) (= trigger-plug-side :r))) "has-plugs"))})
        
        ;; Main Shell Body
        (d/div
          {:class "controller-body"
           :style {:background-color (if full-build?
                                       (str "var(--shell-" (name shell) ")")
                                       "var(--shell-oem)")}}
          (d/div {:class "controller-handle-left"})
          (d/div {:class "controller-handle-right"}))
        
        ;; Left Stick
        (d/div {:class (str "stick stick-left " 
                            (when (and full-build? notches-firefox?) "has-firefox ")
                            (when (and full-build? notches-wavedash?) "has-wavedash "))}
               (d/div {:class "notch-indicator"}))
        
        ;; D-Pad
        (d/div {:class "d-pad"})
        
        ;; C-Stick
        (d/div {:class "stick stick-c"})
        
        ;; Button Cluster
        (d/div {:class "button-group"}
               (d/div {:class "btn btn-a"} "A")
               (d/div {:class "btn btn-b"} "B")
               (d/div {:class "btn btn-x"} "X")
               (d/div {:class "btn btn-y"} "Y"))))))


(defnc shop-page [{:keys [inventory]}]
  (let [[config set-config] (hooks/use-state initial-state)
        [loading? set-loading] (hooks/use-state false)
        
        full-build? (pricing/full-build? config)
        
        get-stock (fn [item-id] (get inventory item-id 0))
        out-of-stock? (fn [item-id] (<= (get-stock item-id) 0))
        
        set-product (fn [product-id]
                      (set-config (fn [prev] (assoc prev :product product-id))))
        
        toggle-mod (fn [mod-id]
                     (set-config (fn [prev]
                                   (let [new-val (not (get prev mod-id))
                                         next-state (assoc prev mod-id new-val)]
                                     (cond
                                       (and (= mod-id :notches-firefox?) new-val)
                                       (assoc next-state :notches-wavedash? false)
                                       
                                       (and (= mod-id :notches-wavedash?) new-val)
                                       (assoc next-state :notches-firefox? false)
                                       
                                       :else next-state)))))
        
        set-shell (fn [shell-id]
                    (set-config (fn [prev] (assoc prev :shell shell-id))))
                    
        set-buttons (fn [button-id]
                      (set-config (fn [prev] (assoc prev :buttons button-id))))
                    
        set-trigger-side (fn [side]
                           (set-config (fn [prev] (assoc prev :trigger-plug-side side))))
                    
        handle-checkout (fn []
                          (set-loading true)
                          (-> (js/fetch "/api/checkout"
                                        #js {:method "POST"
                                             :headers #js {"Content-Type" "application/json"}
                                             :body (js/JSON.stringify (clj->js config))})
                              (.then (fn [res]
                                       (if (.-ok res)
                                         (.json res)
                                         (throw (js/Error. "Failed to create checkout session")))))
                              (.then (fn [data]
                                       (set! (.-href js/window.location) (.-url data))))
                              (.catch (fn [err]
                                        (js/console.error err)
                                        (set-loading false)
                                        (js/alert "Checkout failed. Is the backend running?")))))
        
        selected-product (pricing/product-by-id (:product config))
        active-mods (when full-build? (filter #(get config (:id %)) pricing/mods))
        active-addons (when full-build? (filter #(get config (:id %)) pricing/addons))
        selected-shell (when full-build? (first (filter #(= (:id %) (:shell config)) pricing/shells)))
        shell-price (if full-build? (or (:price selected-shell) 0) 0)
        selected-buttons (when full-build? (first (filter #(= (:id %) (:buttons config)) pricing/buttons)))
        buttons-price (if full-build? (or (:price selected-buttons) 0) 0)
        total-price (pricing/calculate-total config)]
    
    (d/div
      {:class "page shop-page"}
      (d/div
        {:class "shop-grid"}
        
        ;; Visualizer Map
        ($ visualizer {:config config})
        
        ;; Configurator Panel
        (d/div
          {:class "config-panel"}
          
          ;; Product Tier Selection
          (d/div {:class "config-section"}
                 (d/h3 "Product")
                 (d/div {:class "config-options product-options"}
                        (map (fn [{:keys [id label description price]}]
                               (let [oos? (out-of-stock? id)
                                     stock (get-stock id)]
                                 (d/button
                                   {:key (name id)
                                    :class (str "toggle-btn product-btn " (when (= (:product config) id) "active ") (when oos? "disabled"))
                                    :disabled oos?
                                    :on-click #(set-product id)}
                                   (d/span {:class "product-label"} label)
                                   (d/span {:class "product-price"} (str "$" price))
                                   (d/span {:class "product-desc"} description)
                                   (if oos?
                                     (d/span {:class "out-of-stock-badge" :style {:color "var(--primary-color)" :font-size "0.8em" :margin-top "5px"}} "Out of Stock")
                                     (d/span {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "5px"}} (str stock " in stock"))))))
                             pricing/products)))
          
          (when full-build?
            (d/div {:class "config-section"}
                   (d/h3 "Shell Color")
                   
                   (d/h4 {:style {:margin "10px 0 5px 0" :font-size "0.9em"}} "OEM Shells")
                   (d/div {:class "config-options"}
                          (map (fn [{:keys [id label price]}]
                                 (let [oos? (out-of-stock? id)
                                       stock (get-stock id)]
                                   (d/button
                                     {:key (name id)
                                      :class (str "toggle-btn " (when (= (:shell config) id) "active ") (when oos? "disabled"))
                                      :disabled oos?
                                      :on-click #(set-shell id)}
                                     (str label " (+$" price ")")
                                     (if oos?
                                       (d/div {:style {:color "var(--primary-color)" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                       (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                               (filter #(= (:type %) :oem) pricing/shells)))
                               
                   (d/h4 {:style {:margin "15px 0 5px 0" :font-size "0.9em"}} "Extremerate Shells")
                   (d/div {:class "config-options"}
                          (map (fn [{:keys [id label price]}]
                                 (let [oos? (out-of-stock? id)
                                       stock (get-stock id)]
                                   (d/button
                                     {:key (name id)
                                      :class (str "toggle-btn " (when (= (:shell config) id) "active ") (when oos? "disabled"))
                                      :disabled oos?
                                      :on-click #(set-shell id)}
                                     (str label " (+$" price ")")
                                     (if oos?
                                       (d/div {:style {:color "var(--primary-color)" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                       (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                               (filter #(= (:type %) :extremerate) pricing/shells)))))
                               
          ;; Buttons (full build only)
          (when full-build?
            (d/div {:class "config-section"}
                   (d/h3 "Buttons")
                   (d/div {:class "config-options"}
                          (map (fn [{:keys [id label price]}]
                                 (let [oos? (out-of-stock? id)
                                       stock (get-stock id)]
                                   (d/button
                                     {:key (name id)
                                      :class (str "toggle-btn " (when (= (:buttons config) id) "active ") (when oos? "disabled"))
                                      :disabled oos?
                                      :on-click #(set-buttons id)}
                                     (str label " (+$" price ")")
                                     (if oos?
                                       (d/div {:style {:color "var(--primary-color)" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                       (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                               pricing/buttons))))
          
          ;; Modifications (full build only)
          (when full-build?
            (d/div {:class "config-section"}
                   (d/h3 "Modifications")
                   (d/div {:class "config-options"}
                          (map (fn [{:keys [id label price]}]
                                 (let [active? (get config id)
                                       oos? (out-of-stock? id)
                                       stock (get-stock id)]
                                   (d/button
                                     {:key (name id)
                                      :class (str "toggle-btn " (when active? "active ") (when oos? "disabled"))
                                      :disabled oos?
                                      :on-click #(toggle-mod id)}
                                     (str label " (+$" price ")")
                                     (if oos?
                                       (d/div {:style {:color "var(--primary-color)" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                       (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                               pricing/mods))))
                               
          ;; Addons (full build only)
          (when full-build?
            (d/div {:class "config-section"}
                   (d/h3 "Addons")
                   (d/div {:class "config-options"}
                          (map (fn [{:keys [id label price]}]
                                 (let [active? (get config id)
                                       oos? (out-of-stock? id)
                                       stock (get-stock id)]
                                   (d/button
                                     {:key (name id)
                                      :class (str "toggle-btn " (when active? "active ") (when oos? "disabled"))
                                      :disabled oos?
                                      :on-click #(toggle-mod id)}
                                     (str label " (+$" price ")")
                                     (if oos?
                                       (d/div {:style {:color "var(--primary-color)" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                       (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                               pricing/addons))
                   ;; Trigger options when trigger-plugs are active
                   (when (:trigger-plugs? config)
                     (d/div {:class "trigger-options" :style {:margin-top "10px"}}
                            (d/h4 {:style {:margin-bottom "5px" :font-size "0.9em"}} "Trigger Side:")
                            (d/div {:class "config-options" :style {:gap "5px"}}
                                   (map (fn [[side label]]
                                          (d/button
                                            {:key (name side)
                                             :class (str "toggle-btn " (when (= (:trigger-plug-side config) side) "active"))
                                             :style {:padding "5px 10px" :font-size "0.85em"}
                                             :on-click #(set-trigger-side side)}
                                            label))
                                        [[:l "Left Only"] [:r "Right Only"] [:both "Both"]]))))))
          
          ;; Price Breakdown
          (d/div
            {:class "price-box"}
            (d/div {:class "price-row"}
                   (d/span (:label selected-product))
                   (d/span (str "$" (:price selected-product))))
            (when (and full-build? (> shell-price 0))
              (d/div {:class "price-row"}
                     (d/span (str (:label selected-shell) " Shell"))
                     (d/span (str "+$" shell-price))))
            (when (and full-build? (> buttons-price 0))
              (d/div {:class "price-row"}
                     (d/span (:label selected-buttons))
                     (d/span (str "+$" buttons-price))))
            (when full-build?
              (map (fn [m]
                     (d/div {:key (name (:id m)) :class "price-row"}
                            (d/span (:label m))
                            (d/span (str "+$" (:price m)))))
                   active-mods))
            (when full-build?
              (if (and (:trigger-plugs? config) (:spring-cut? config))
                (d/div {:key "addons-combo" :class "price-row"}
                       (d/span "Trigger Plugs & Cut Springs")
                       (d/span "+$10"))
                (map (fn [a]
                       (d/div {:key (name (:id a)) :class "price-row"}
                              (d/span (:label a))
                              (d/span (str "+$" (:price a)))))
                     active-addons)))
            
            (d/div {:class "price-total"}
                   (d/span "Total")
                   (d/span (str "$" total-price)))
            
            (d/button {:class "checkout-btn" 
                       :on-click handle-checkout
                       :disabled loading?} 
                      (if loading? "Loading..." "Build It"))))))))
