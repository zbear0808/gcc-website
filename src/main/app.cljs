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
   [helix.hooks :as hooks]))


(defnc app []
  (let [[cart set-cart] (hooks/use-state {})]
    ($ BrowserRouter
       (d/div
        {:class "app-container"}
        ($ document-title)
        ($ header {:cart cart})
        (d/main
         {:class "main-content"}
         ($ Routes
            ($ Route {:path "/" :element ($ shop-page)})
            ($ Route {:path "/parts" :element ($ parts-page {:cart cart :set-cart set-cart})})
            ($ Route {:path "/cart" :element ($ cart-page {:cart cart :set-cart set-cart})})))
        ($ footer)))))


(defonce root
  (rdom/createRoot
   (js/document.getElementById "app")))


(defn render []
  (.render root ($ app)))


(defn ^:export init []
  (render))
