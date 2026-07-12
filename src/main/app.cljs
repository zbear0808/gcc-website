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
   [helix.hooks :as hooks]))


(defnc app []
  (let [[cart set-cart] (hooks/use-state {})
        [inventory set-inventory] (hooks/use-state {})
        
        load-inventory (fn []
                         (-> (js/fetch "/api/inventory")
                             (.then #(.json %))
                             (.then (fn [data]
                                      (let [clj-data (js->clj data :keywordize-keys true)]
                                        (set-inventory clj-data))))
                             (.catch #(js/console.error "Failed to fetch inventory:" %))))]
                             
    (hooks/use-effect :once
      (load-inventory))

    ($ BrowserRouter
       (d/div
        {:class "app-container"}
        ($ document-title)
        ($ header {:cart cart})
        (d/main
         {:class "main-content"}
         ($ Routes
            ($ Route {:path "/" :element ($ shop-page {:inventory inventory})})
            ($ Route {:path "/parts" :element ($ parts-page {:cart cart :set-cart set-cart :inventory inventory})})
            ($ Route {:path "/cart" :element ($ cart-page {:cart cart :set-cart set-cart :inventory inventory})})
            ($ Route {:path "/admin" :element ($ admin-page)})))
        ($ footer)))))


(defonce root
  (rdom/createRoot
   (js/document.getElementById "app")))


(defn render []
  (.render root ($ app)))


(defn ^:export init []
  (render))
