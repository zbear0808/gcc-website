(ns main.components.footer
  (:require
   [helix.core :refer [defnc $]]
   [helix.dom :as d]
   [main.components.icons :as icons]))


(defnc footer []
  (d/footer
   {:class "footer"
    :style {:text-align "center"
            :padding "2rem"
            :color "var(--text-muted)"
            :margin-top "4rem"
            :border-top "1px solid var(--border-color)"}}
   (d/div
    {:style {:display "flex"
             :justify-content "center"
             :align-items "center"
             :gap "1.5rem"
             :margin-bottom "1rem"}}
    (d/a {:href "https://github.com/gcc-controllers"
          :target "_blank"
          :rel "noopener noreferrer"
          :style {:color "var(--text-muted)"
                  :transition "color 0.2s ease"}
          :title "GitHub"}
         ($ icons/github-icon))
    (d/a {:href "mailto:contact@gcccontrollers.com"
          :style {:color "var(--text-muted)"
                  :transition "color 0.2s ease"}
          :title "Email"}
         ($ icons/email-icon)))
   (d/p "© 2026 GCC Shop. All rights reserved.")))
