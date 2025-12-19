(ns main.components.footer
  (:require
   [helix.core :refer [defnc $]]
   [helix.dom :as d]
   [main.components.icons :as icons]))


(defnc social-link [{:keys [href label social-class on-click children]}]
  (d/a {:href (when-not on-click href)
        :target "_blank"
        :rel "noopener noreferrer"
        :class (str "btn social-link " social-class)
        :aria-label label
        :on-click on-click}
       children))


(defnc footer []
  (d/footer
   {:class "footer"}
   (d/div
    {:class "footer-social-links"}
    ($ social-link
       {:href "https://instagram.com/zugood"
        :label "Instagram"
        :social-class "social-link-instagram"}
       ($ icons/instagram-icon))

    ($ social-link
       {:href "https://linkedin.com/in/zubaira2"
        :label "LinkedIn"
        :social-class "social-link-linkedin"}
       ($ icons/linkedin-icon))

    ($ social-link
       {:href "https://github.com/zbear0808"
        :label "GitHub"
        :social-class "social-link-github"}
       ($ icons/github-icon))

    ($ social-link
       {:href "#"
        :label "YouTube"
        :social-class "social-link-youtube"}
       ($ icons/youtube-icon))

    ($ social-link
       {:href "mailto:zugood.lasers@gmail.com"
        :label "Email"
        :social-class "social-link-email"
        :on-click (fn [e]
                    (.preventDefault e)
                    (.open js/window "mailto:zugood.lasers@gmail.com" "mail"))}
       ($ icons/email-icon)))))
