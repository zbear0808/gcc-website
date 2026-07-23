(ns main.state
  (:require [helix.hooks :as hooks]))

(defonce !state (atom {:cart {}
                       :inventory {}
                       :config {}}))

(defn use-app-state []
  (let [[val set-val] (hooks/use-state @!state)]
    (hooks/use-effect :once
      (let [k (gensym "watch")]
        (add-watch !state k (fn [_ _ _ new-val]
                              (set-val new-val)))
        #(remove-watch !state k)))
    val))
