(ns main.components.skeleton
  (:require
   [helix.core :refer [defnc]]
   [helix.dom :as d]))


(defnc skeleton-loader [{:keys [show]}]
  (when show
    (d/div
     {:class "skeleton-loader"}
     (d/img {:src "./laser-warning.svg"
             :alt "Loading..."
             :class "skeleton-icon"}))))
