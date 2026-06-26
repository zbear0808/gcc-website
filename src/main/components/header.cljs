(ns main.components.header
  (:require
    ["react-router-dom" :refer [useNavigate]]
    [helix.core :refer [defnc]]
    [helix.dom :as d]))

(defnc header []
  (let [navigate (useNavigate)]
    (d/header {:class "header"}
              (d/div {:class "header-title" :style {:margin "0 auto"}}
                     (d/h1 {:class "header-name trichromatic"
                            :data-text "GCC Shop"
                            :on-click #(navigate "/")}
                           "GCC Shop")))))
