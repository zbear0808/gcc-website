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
   [main.pages.parts :refer [parts-page]]))


(defnc app []
  ($ BrowserRouter
     (d/div
      {:class "app-container"}
      ($ document-title)
      ($ header)
      (d/main
       {:class "main-content"}
       ($ Routes
          ($ Route {:path "/" :element ($ shop-page)})
          ($ Route {:path "/parts" :element ($ parts-page)})))
      ($ footer))))


(defonce root
  (rdom/createRoot
   (js/document.getElementById "app")))


(defn render []
  (.render root ($ app)))


(defn ^:export init []
  (render))
