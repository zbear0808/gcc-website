(ns main.app-test
  (:require
    ["@testing-library/react" :as tlr]
    ["react-router-dom" :refer [MemoryRouter]]
    [clojure.test :refer [deftest is use-fixtures]]
    [helix.core :refer [$]]
    [main.components.header :refer [header]]))


(defn setup-root
  [f]
  (f)
  (tlr/cleanup))


(use-fixtures :each setup-root)


(deftest header-displays-name
  (let [container (tlr/render
                    ($ MemoryRouter
                       ($ header)))
        name-element (.getByText container "GCC Shop")]
    (is (some? name-element))
    (is (= "GCC Shop" (.-textContent name-element)))))
