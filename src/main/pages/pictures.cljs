(ns main.pages.pictures
  (:require
   [helix.core :refer [defnc $]]
   [helix.dom :as d]
   [helix.hooks :as hooks]
   [main.components.skeleton :refer [skeleton-loader]]))


(def image-files
  ["CHYLPics-29.jpg"
   "BASS GIRLS teddy.jpg"
   "BASS GIRLS wide.jpg"
   "boogie boi.jpg"
   "CHYLPics-13.jpg"
   "CHYLPics-18.jpg"
   "CHYLPics-2.jpg"
   "CHYLPics-4.jpg"
   "CHYLPics-6.jpg"
   "crowd.jpg"
   "gensuo VERT.jpg"
   "gudemami.jpg"
   "indigo b2b.jpg"
   "REYSUO BW compress.jpg"
   "REYSUO front stage.jpg"
   "REYSUO vert.jpg"
   "yeahdudesame.jpg"])


(defnc picture-item [{:keys [filename]}]
  (let [[loading set-loading] (hooks/use-state true)]
    (d/div
     {:class "card relative aspect-4-3 overflow-hidden picture-container"}
     ($ skeleton-loader {:show loading})
     (d/img {:src (str "./images/" filename)
             :alt filename
             :class "img-cover img-block hover-scale-opacity picture-img"
             :loading "lazy"
             :onLoad #(set-loading false)}))))


(defnc pictures-page []
  (d/div
   {:class "page pictures-page"}
   (d/h1 "Pictures")
   (d/div {:class "grid grid-auto-fit-md pictures-grid"}
          (for [filename image-files]
            ($ picture-item {:key filename :filename filename})))))
