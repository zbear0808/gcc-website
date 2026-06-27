(ns main.components.footer
  (:require
   [helix.core :refer [defnc $]]
   [helix.dom :as d]
   [main.components.icons :as icons]))


(defn mobile?
  "Detect if user is on a mobile device"
  []
  (or (< (.-innerWidth js/window) 768)
      (some? (re-find #"Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini"
                      (.-userAgent js/navigator)))))


(defnc footer []
  (d/footer
   {:class "footer" :style {:text-align "center" :padding "2rem" :color "var(--text-muted)" :margin-top "4rem" :border-top "1px solid var(--border-color)"}}
   (d/p "© 2026 GCC Shop. All rights reserved.")))
