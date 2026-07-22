(ns main.pages.admin
  (:require
    [helix.core :refer [defnc $]]
    [helix.dom :as d]
    [helix.hooks :as hooks]
    [main.pricing :as pricing]))

(defnc admin-page []
  (let [[inventory set-inventory] (hooks/use-state {})
        [loading? set-loading] (hooks/use-state true)
        [saving? set-saving] (hooks/use-state false)
        [message set-message] (hooks/use-state nil)
        
        all-items pricing/all-items
        
        load-inventory (fn []
                         (set-loading true)
                         (-> (js/fetch "/api/inventory")
                             (.then #(.json %))
                             (.then (fn [data]
                                      (let [clj-data (js->clj data :keywordize-keys true)]
                                        (set-inventory clj-data)
                                        (set-loading false))))
                             (.catch (fn [err]
                                       (js/console.error err)
                                       (set-loading false)))))
                                       
        update-stock (fn [id val]
                       (let [parsed (js/parseInt val 10)]
                         (when-not (js/isNaN parsed)
                           (set-inventory (fn [prev] (assoc prev id parsed))))))
                           
        save-inventory (fn []
                         (set-saving true)
                         (set-message nil)
                         (-> (js/fetch "/api/inventory"
                                       #js {:method "POST"
                                            :headers #js {"Content-Type" "application/json"}
                                            :body (js/JSON.stringify (clj->js inventory))})
                             (.then #(.json %))
                             (.then (fn [res]
                                      (if (.-success res)
                                        (set-message "Inventory updated successfully!")
                                        (set-message "Failed to update inventory."))
                                      (set-saving false)))
                             (.catch (fn [err]
                                       (js/console.error err)
                                       (set-message "Error saving inventory.")
                                       (set-saving false)))))]
    
    (hooks/use-effect :once
      (load-inventory))
      
    (d/div
      {:class "page admin-page" :style {:padding "20px" :max-width "800px" :margin "0 auto"}}
      (d/h2 "Inventory Admin")
      (if loading?
        (d/p "Loading inventory...")
        (d/div
          (d/div {:style {:display "flex" :flex-direction "column" :gap "10px" :margin-bottom "20px"}}
            (map (fn [{:keys [id label]}]
                   (let [stock (get inventory id 0)]
                     (d/div {:key (name id) :style {:display "flex" :justify-content "space-between" :align-items "center" :padding "10px" :border "1px solid var(--border-color)" :border-radius "8px"}}
                       (d/span label)
                       (d/input {:type "number" 
                                 :value stock 
                                 :on-change #(update-stock id (.. % -target -value))
                                 :style {:width "80px" :padding "5px" :background "var(--bg-lighter)" :border "1px solid var(--border-color)" :color "var(--text-color)" :border-radius "4px"}}))))
                 all-items))
          (d/button {:class "checkout-btn" :on-click save-inventory :disabled saving?}
                    (if saving? "Saving..." "Save Inventory"))
          (when message
            (d/p {:style {:margin-top "10px" :color "var(--primary-color)"}} message)))))))
