(ns main.pages.videos
  (:require
   [helix.core :refer [defnc $]]
   [helix.dom :as d]
   [helix.hooks :as hooks]
   [main.components.skeleton :refer [skeleton-loader]]))


(def video-ids
  ["JWaN034pKbQ"
   "jOo3sgdbWy8"
   "OAJiO6TRosA"
   "EigAW9_Kko4"
   "qEGCYq2mwR8"
   "5GHO4rhm4Ps"
   "XlnbJfx5i8o"])


(defnc video-embed [{:keys [video-id]}]
  (let [[loading set-loading] (hooks/use-state true)]
    (d/div
     {:class "card relative aspect-16-9 video-container"}
     ($ skeleton-loader {:show loading})
     (d/iframe {:src (str "https://www.youtube.com/embed/" video-id)
                :title "YouTube video player"
                :frameBorder "0"
                :allow "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                :allowFullScreen true
                :class "overlay-full video-iframe"
                :onLoad #(set-loading false)}))))


(defnc videos-page []
  (d/div
   {:class "page"}
   (d/h1 "Videos")
   (d/div {:class "grid grid-auto-fit-lg gap-lg videos-grid"}
          (for [video-id video-ids]
            ($ video-embed {:key video-id :video-id video-id})))))
