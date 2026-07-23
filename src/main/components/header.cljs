(ns main.components.header
  (:require
    ["react-router-dom" :refer [useNavigate]]
    [helix.core :refer [defnc]]
    [helix.dom :as d]
    [main.state :refer [use-app-state]]))

(defnc header []
  (let [navigate (useNavigate)
        {:keys [cart]} (use-app-state)
        cart-count (reduce + 0 (vals cart))]
    (d/header {:class "header"}
              (d/div {:class "header-content" :style {:display "flex" :justify-content "space-between" :align-items "center" :width "100%" :max-width "1200px" :margin "0 auto" :padding "0 2rem"}}
                     (d/div {:class "header-title"}
                            (d/h1 {:class "header-name trichromatic"
                                   :data-text "GCC Shop"
                                   :style {:cursor "pointer"}
                                   :on-click #(navigate "/")}
                                  "GCC Shop"))
                     (d/nav {:class "header-nav" :style {:display "flex" :gap "1.5rem" :align-items "center"}}
                            (d/a {:class "nav-link" :on-click #(navigate "/") :style {:cursor "pointer" :font-weight "bold"}} "Builds")
                            (d/a {:class "nav-link" :on-click #(navigate "/parts") :style {:cursor "pointer" :font-weight "bold"}} "Parts")
                            (d/div {:class "cart-icon" 
                                    :on-click #(navigate "/cart") 
                                    :style {:cursor "pointer" :display "flex" :align-items "center" :position "relative"}}
                                   (d/svg {:xmlns "http://www.w3.org/2000/svg" :width "24" :height "24" :fill "none" :viewBox "0 0 24 24" :stroke "currentColor"}
                                          (d/path {:strokeLinecap "round" :strokeLinejoin "round" :strokeWidth "2" :d "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"}))
                                   (when (> cart-count 0)
                                     (d/span {:style {:position "absolute" :top "-8px" :right "-12px" :background "var(--accent-color, #ff4081)" :color "white" :border-radius "50%" :padding "2px 6px" :font-size "0.75rem" :font-weight "bold"}} 
                                             cart-count))))))))
