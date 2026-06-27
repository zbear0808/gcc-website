(ns main.components.header
  (:require
    ["react-router-dom" :refer [useNavigate]]
    [helix.core :refer [defnc]]
    [helix.dom :as d]))

(defnc header []
  (let [navigate (useNavigate)]
    (d/header {:class "header"}
              (d/div {:class "header-content" :style {:display "flex" :justify-content "space-between" :align-items "center" :width "100%" :max-width "1200px" :margin "0 auto" :padding "0 2rem"}}
                     (d/div {:class "header-title"}
                            (d/h1 {:class "header-name trichromatic"
                                   :data-text "GCC Shop"
                                   :style {:cursor "pointer"}
                                   :on-click #(navigate "/")}
                                  "GCC Shop"))
                     (d/nav {:class "header-nav" :style {:display "flex" :gap "1.5rem"}}
                            (d/a {:class "nav-link" :on-click #(navigate "/") :style {:cursor "pointer" :font-weight "bold"}} "Builds")
                            (d/a {:class "nav-link" :on-click #(navigate "/parts") :style {:cursor "pointer" :font-weight "bold"}} "Parts"))))))
