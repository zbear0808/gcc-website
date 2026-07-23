(ns main.pages.shop
  (:require
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [clojure.string :as str]
    [main.state :as state]
    [main.pricing :as pricing]
    [helix.hooks :as hooks]))

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

(defnc config-section-buttons [{:keys [title category items config out-of-stock? get-stock set-fn multi? disabled-fn groups]}]
  (let [render-item (fn [{:keys [id label price description]}]
                       (let [oos? (out-of-stock? id)
                             stock (get-stock id)
                             active? (if multi? (get config id) (= (get config category) id))
                             disabled? (or oos? (and disabled-fn (disabled-fn id)))]
                           (d/button
                             {:key (name id)
                              :class (str "toggle-btn " (when active? "active ") (when disabled? "disabled"))
                              :disabled disabled?
                              :on-click #(set-fn id)}
                             (str label (when (and price (> price 0)) (str " (+$" price ")")))
                           (when description
                             (d/div {:style {:font-size "0.8em" :color "var(--text-muted)" :margin-top "2px"}} description))
                           (if oos?
                             (d/div {:style {:color "red" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                             (when-not (or (= id :cable-oem) (= id :cable-3rd-party-3m) (= id :rumble-none))
                               (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock")))))))]
    (d/div {:class "config-section"}
           (d/h3 title)
           (if groups
             ($ :<>
               (mapv (fn [{:keys [group-title filter-fn]}]
                       (let [group-items (filterv filter-fn items)]
                         (when (seq group-items)
                           (d/div {:key group-title}
                             (d/h4 {:style {:margin "15px 0 5px 0" :font-size "0.9em"}} group-title)
                             (d/div {:class "config-options"}
                                    (mapv render-item group-items))))))
                     groups))
             (d/div {:class "config-options"}
                    (mapv render-item items))))))


(defnc shop-page []
  (let [{:keys [config inventory cart]} (state/use-app-state)
        [loading? set-loading] (hooks/use-state false)
        
        set-config (fn [updater]
                     (swap! state/!state update :config updater))
        
        full-build? (pricing/full-build? config)
        diy-kit? (pricing/diy-kit? config)
        customizable-base? (or full-build? diy-kit?)
        
        get-stock (fn [item-id] (get inventory item-id 0))
        out-of-stock? (fn [item-id]
                        (if (= item-id :rumble-none)
                          false
                          (<= (get-stock item-id) 0)))
        
        set-product (fn [product-id]
                      (set-config (fn [prev] (pricing/sanitize-config (assoc prev :product product-id)))))
        
        toggle-mod (fn [mod-id]
                     (set-config (fn [prev]
                                   (let [new-val (not (get prev mod-id))]
                                     (-> prev
                                         (assoc mod-id new-val)
                                         (cond-> (and (= mod-id :notches-firefox?) new-val) (assoc :notches-wavedash? false))
                                         (cond-> (and (= mod-id :notches-wavedash?) new-val) (assoc :notches-firefox? false))
                                         (pricing/sanitize-config))))))
        
        set-shell (fn [shell-id]
                    (set-config (fn [prev] (pricing/sanitize-config (assoc prev :shell shell-id)))))
                    
        set-buttons (fn [button-id]
                      (set-config (fn [prev] (pricing/sanitize-config (assoc prev :buttons button-id)))))
                    
        set-trigger-side (fn [side]
                           (set-config (fn [prev] (pricing/sanitize-config (assoc prev :trigger-plug-side side)))))
                           
        set-rumble (fn [rumble-id]
                     (set-config (fn [prev] (pricing/sanitize-config (assoc prev :rumble rumble-id)))))
                     
        set-cable (fn [cable-id]
                    (set-config (fn [prev] (pricing/sanitize-config (assoc prev :cable cable-id)))))
                    
        set-slider-pots (fn [slider-pots-id]
                          (set-config (fn [prev] (pricing/sanitize-config (assoc prev :slider-pots slider-pots-id)))))
                    
        set-z-button (fn [z-button-id]
                       (set-config (fn [prev] (pricing/sanitize-config (assoc prev :z-button z-button-id)))))
                    
        handle-checkout (fn []
                          (set-loading true)
                          (-> (js/fetch "/api/checkout"
                                        #js {:method "POST"
                                             :headers #js {"Content-Type" "application/json"}
                                             :body (js/JSON.stringify (clj->js {:config config
                                                                                :cart cart
                                                                                :parts? (not-empty cart)}))})
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
        
        {:keys [shell buttons rumble cable slider-pots z-button]} config
        selected-product (pricing/product-by-id (:product config))
        active-mods (when full-build? (filterv #(get config (:id %)) pricing/mods))
        active-addons (when full-build? (filterv #(get config (:id %)) pricing/addons))
        selected-shell (when full-build? (some #(when (= (:id %) shell) %) pricing/shells))
        shell-price (if full-build? (or (:price selected-shell) 0) 0)
        selected-buttons (when full-build? (some #(when (= (:id %) buttons) %) pricing/buttons))
        buttons-price (if full-build? (or (:price selected-buttons) 0) 0)
        selected-rumble (when full-build? (some #(when (= (:id %) rumble) %) pricing/rumbles))
        rumble-price (if full-build? (or (:price selected-rumble) 0) 0)
        selected-cable (when customizable-base? (some #(when (= (:id %) cable) %) pricing/cables))
        cable-price (if customizable-base? (or (:price selected-cable) 0) 0)
        selected-slider-pots (when customizable-base? (some #(when (= (:id %) slider-pots) %) pricing/slider-pots))
        slider-pots-price (if customizable-base? (or (:price selected-slider-pots) 0) 0)
        selected-z-button (when customizable-base? (some #(when (= (:id %) z-button) %) pricing/z-buttons))
        z-button-price (if customizable-base? (or (:price selected-z-button) 0) 0)
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
                        (mapv (fn [{:keys [id label description price]}]
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
                                     (d/span {:class "out-of-stock-badge" :style {:color "red" :font-size "0.8em" :margin-top "5px"}} "Out of Stock")
                                     (d/span {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "5px"}} (str stock " in stock"))))))
                             pricing/products)))
          
          (when full-build?
            ($ :<>
               (d/div {:class "config-section"}
                      (d/h3 "Shell Color")
                      (d/h4 {:style {:margin "10px 0 5px 0" :font-size "0.9em"}} "OEM Shells")
                      (d/div {:class "config-options"}
                             (mapv (fn [{:keys [id label price]}]
                                    (let [oos? (out-of-stock? id)
                                          stock (get-stock id)]
                                      (d/button
                                        {:key (name id)
                                         :class (str "toggle-btn " (when (= shell id) "active ") (when oos? "disabled"))
                                         :disabled oos?
                                         :on-click #(set-shell id)}
                                        (str label " (+$" price ")")
                                        (if oos?
                                          (d/div {:style {:color "red" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                          (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                                  (filterv #(= (:type %) :oem) pricing/shells)))
                                  
                      (d/h4 {:style {:margin "15px 0 5px 0" :font-size "0.9em"}} "Extremerate Shells")
                      (d/div {:class "config-options"}
                             (mapv (fn [{:keys [id label price]}]
                                    (let [oos? (out-of-stock? id)
                                          stock (get-stock id)]
                                      (d/button
                                        {:key (name id)
                                         :class (str "toggle-btn " (when (= shell id) "active ") (when oos? "disabled"))
                                         :disabled oos?
                                         :on-click #(set-shell id)}
                                        (str label " (+$" price ")")
                                        (if oos?
                                          (d/div {:style {:color "red" :font-size "0.8em" :margin-top "2px"}} "Out of Stock")
                                          (d/div {:style {:color "var(--text-muted)" :font-size "0.8em" :margin-top "2px"}} (str stock " in stock"))))))
                                  (filterv #(= (:type %) :extremerate) pricing/shells))))
               
               ($ config-section-buttons {:title "Buttons" :category :buttons :items pricing/buttons :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn set-buttons :multi? false
                                          :groups [{:group-title "OEM Buttons" :filter-fn #(= (:type %) :oem)}
                                                   {:group-title "Extremerate 3rd Party" :filter-fn #(= (:type %) :extremerate)}
                                                   {:group-title "Other 3rd Party" :filter-fn #(= (:type %) :other-3rd-party)}]})))

          (when customizable-base?
            ($ :<>
               ($ config-section-buttons {:title "Cable" :category :cable :items pricing/cables :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn set-cable :multi? false 
                                          :disabled-fn (fn [id] (or (and full-build? (= id :cable-oem) (not= (:type selected-shell) :oem))
                                                                    (and diy-kit? (= id :cable-oem))))})
               
               (when full-build?
                 ($ config-section-buttons {:title "Rumble Motor" :category :rumble :items pricing/rumbles :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn set-rumble :multi? false}))
               
               ($ config-section-buttons {:title "Slider Potentiometers" :category :slider-pots :items pricing/slider-pots :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn set-slider-pots :multi? false})
               
               ($ config-section-buttons {:title "Z Button" :category :z-button :items pricing/z-buttons :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn set-z-button :multi? false})))

          (when full-build?
            ($ :<>
               ($ config-section-buttons {:title "Modifications" :category :mods :items pricing/mods :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn toggle-mod :multi? true})
               
               ($ config-section-buttons {:title "Addons" :category :addons :items pricing/addons :config config :out-of-stock? out-of-stock? :get-stock get-stock :set-fn toggle-mod :multi? true})
               
               ;; Trigger options when trigger-plugs are active
               (when (:trigger-plugs? config)
                 (d/div {:class "trigger-options" :style {:margin-top "10px"}}
                        (d/h4 {:style {:margin-bottom "5px" :font-size "0.9em"}} "Trigger Side:")
                        (d/div {:class "config-options" :style {:gap "5px"}}
                               (mapv (fn [[side label]]
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
            (when (and customizable-base? (> cable-price 0))
              (d/div {:class "price-row"}
                     (d/span (:label selected-cable))
                     (d/span (str "+$" cable-price))))
            (when (and full-build? (> rumble-price 0))
              (d/div {:class "price-row"}
                     (d/span (:label selected-rumble))
                     (d/span (str "+$" rumble-price))))
            (when (and customizable-base? (> slider-pots-price 0))
              (d/div {:class "price-row"}
                     (d/span (:label selected-slider-pots))
                     (d/span (str "+$" slider-pots-price))))
            (when (and customizable-base? (> z-button-price 0))
              (d/div {:class "price-row"}
                     (d/span (:label selected-z-button))
                     (d/span (str "+$" z-button-price))))
            (when full-build?
              (mapv (fn [m]
                     (d/div {:key (name (:id m)) :class "price-row"}
                            (d/span (:label m))
                            (when (:price m)
                              (d/span (str "+$" (:price m))))))
                   active-mods))
            (when full-build?
              (mapv (fn [a]
                     (d/div {:key (name (:id a)) :class "price-row"}
                            (d/span (:label a))
                            (when (:price a)
                              (d/span (str "+$" (:price a))))))
                   active-addons))
            
            (d/div {:class "price-total"}
                   (d/span "Total")
                   (d/span (str "$" total-price)))
            
            (d/button {:class "checkout-btn" 
                       :on-click handle-checkout
                       :disabled loading?} 
                      (if loading? "Loading..." "Build It"))))))))
