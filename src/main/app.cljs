(ns main.app
  (:require
   ["react-dom/client" :as rdom]
   ["react-router-dom" :refer [BrowserRouter Routes Route]]
   [helix.core :refer [defnc $]]
   [helix.dom :as d]
   [main.components.document-title :refer [document-title]]
   [main.components.footer :refer [footer]]
   [main.components.header :refer [header]]
   [main.pages.shop :refer [shop-page]]
   [main.pages.parts :refer [parts-page]]
   [main.pages.cart :refer [cart-page]]
   [main.pages.admin :refer [admin-page]]
   [main.pages.product :refer [product-page]]
   [main.pages.faq :refer [faq-page]]
   [helix.hooks :as hooks]
   [main.state :as state]
   [main.pricing :as pricing]))


(defnc app []
  (let [load-inventory (fn []
                         (-> (js/fetch "/api/inventory")
                             (.then (fn [res]
                                      (if (.-ok res)
                                        (.json res)
                                        (throw (js/Error. "Server not running")))))
                             (.then (fn [data]
                                      (let [clj-data (js->clj data :keywordize-keys true)]
                                        (swap! state/!state assoc :inventory clj-data))))
                             (.catch (fn [err]
                                       (js/console.warn "Backend not running, using client-side fallback inventory.")
                                       ;; NOTE: This fallback inventory is strictly for local testing 
                                       ;; so the UI can be developed more easily while the backend server is offline.
                                        (let [fallback-inventory (reduce (fn [acc item] (assoc acc (:id item) 10)) {} pricing/all-items)]
                                          (swap! state/!state assoc :inventory fallback-inventory))))))]
                             
    (hooks/use-effect :once
      (load-inventory))

    ($ BrowserRouter
       (d/div
        {:class "app-container"}
        ($ document-title)
        ($ header)
        (d/main
         {:class "main-content"}
         ($ Routes
            ($ Route {:path "/" :element ($ shop-page)})
            ($ Route {:path "/parts" :element ($ parts-page)})
            ($ Route {:path "/faq" :element ($ faq-page)})
            ($ Route {:path "/product/:id" :element ($ product-page)})
            ($ Route {:path "/cart" :element ($ cart-page)})
            ($ Route {:path "/admin" :element ($ admin-page)})))
        ($ footer)))))


(defonce root
  (rdom/createRoot
   (js/document.getElementById "app")))


(defn render []
  (.render root ($ app)))


(defn ^:export init []
  (render))
