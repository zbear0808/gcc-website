(ns main.pages.shop
  (:require
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [helix.hooks :as hooks]
    [clojure.string :as str]
    [main.pricing :as pricing]))

(def initial-state
  {:shell :oem
   :notches-firefox? false
   :notches-wavedash? false
   :paracord? false
   :buttons-custom? false
   :trigger-plugs? false})

(defnc visualizer [{:keys [config]}]
  (let [{:keys [shell notches-firefox? notches-wavedash? paracord? buttons-custom? trigger-plugs?]} config
        shell-class (str "shell-" (name shell))]
    (d/div
      {:class "visualizer-wrapper"}
      (d/div
        {:class "controller-map"}
        
        ;; Triggers
        (d/div {:class (str "trigger trigger-l " (when trigger-plugs? "has-plugs"))})
        (d/div {:class (str "trigger trigger-r " (when trigger-plugs? "has-plugs"))})
        
        ;; Paracord
        (d/div {:class (str "paracord-cable " (when paracord? "is-custom"))})
        
        ;; Main Shell Body
        (d/div
          {:class "controller-body"
           :style {:background-color (str "var(--shell-" (name shell) ")")}}
          (d/div {:class "controller-handle-left"})
          (d/div {:class "controller-handle-right"}))
        
        ;; Left Stick
        (d/div {:class (str "stick stick-left " 
                            (when notches-firefox? "has-firefox ")
                            (when notches-wavedash? "has-wavedash "))}
               (d/div {:class "notch-indicator"}))
        
        ;; D-Pad
        (d/div {:class "d-pad"})
        
        ;; C-Stick
        (d/div {:class "stick stick-c"})
        
        ;; Button Cluster
        (d/div {:class (str "button-group " (when buttons-custom? "is-custom"))}
               (d/div {:class "btn btn-a"} "A")
               (d/div {:class "btn btn-b"} "B")
               (d/div {:class "btn btn-x"} "X")
               (d/div {:class "btn btn-y"} "Y"))))))


(defnc shop-page []
  (let [[config set-config] (hooks/use-state initial-state)
        [loading? set-loading] (hooks/use-state false)
        
        toggle-mod (fn [mod-id]
                     (set-config (fn [prev] (update prev mod-id not))))
        
        set-shell (fn [shell-id]
                    (set-config (fn [prev] (assoc prev :shell shell-id))))
                    
        handle-checkout (fn []
                          (set-loading true)
                          (-> (js/fetch "http://localhost:3000/create-checkout-session"
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
        
        ;; Calculate total price using shared logic
        active-mods (filter #(get config (:id %)) pricing/mods)
        selected-shell (first (filter #(= (:id %) (:shell config)) pricing/shells))
        shell-price (or (:price selected-shell) 0)
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
          
          (d/div {:class "config-section"}
                 (d/h3 "Shell Color")
                 (d/div {:class "config-options"}
                        (map (fn [{:keys [id label price]}]
                               (d/button
                                 {:key (name id)
                                  :class (str "toggle-btn " (when (= (:shell config) id) "active"))
                                  :on-click #(set-shell id)}
                                 (str label " (+$" price ")")))
                             pricing/shells)))
          
          (d/div {:class "config-section"}
                 (d/h3 "Modifications")
                 (d/div {:class "config-options"}
                        (map (fn [{:keys [id label price]}]
                               (let [active? (get config id)]
                                 (d/button
                                   {:key (name id)
                                    :class (str "toggle-btn " (when active? "active"))
                                    :on-click #(toggle-mod id)}
                                   (str label " (+$" price ")"))))
                             pricing/mods)))
          
          ;; Price Breakdown
          (d/div
            {:class "price-box"}
            (d/div {:class "price-row"}
                   (d/span "Phob Base (T3 Stickboxes)")
                   (d/span (str "$" pricing/base-price)))
            (when (> shell-price 0)
              (d/div {:class "price-row"}
                     (d/span (str (:label selected-shell) " Shell"))
                     (d/span (str "+$" shell-price))))
            (map (fn [m]
                   (d/div {:key (name (:id m)) :class "price-row"}
                          (d/span (:label m))
                          (d/span (str "+$" (:price m)))))
                 active-mods)
            
            (d/div {:class "price-total"}
                   (d/span "Total")
                   (d/span (str "$" total-price)))
            
            (d/button {:class "checkout-btn" 
                       :on-click handle-checkout
                       :disabled loading?} 
                      (if loading? "Loading..." "Build It"))))))))
