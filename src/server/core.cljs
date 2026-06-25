(ns server.core
  (:require
   ["express" :as express]
   ["cors" :as cors]
   ["dotenv" :as dotenv]
   ["stripe" :as Stripe]
   [main.pricing :as pricing]))

;; Load env variables
(.config dotenv)

(def stripe (Stripe (.-STRIPE_SECRET_KEY js/process.env)))
(def port (or (.-PORT js/process.env) 3000))

(defn create-app []
  (let [app (express)]
    (.use app (cors))
    ;; Parse JSON bodies
    (.use app (.json express))
    
    (.post app "/create-checkout-session"
           (fn [req res]
             (let [body (.-body req)
                   ;; Convert JS config to Clojure map with keyword keys
                   config (js->clj body :keywordize-keys true)
                   
                   ;; In a real app, you'd define the base URL in ENV
                   domain "http://localhost:5000" 
                   
                   line-items (pricing/get-line-items config)
                   
                   ;; Create Stripe Session
                   session-params (clj->js {:payment_method_types ["card"]
                                            :line_items line-items
                                            :mode "payment"
                                            :success_url (str domain "/?success=true")
                                            :cancel_url (str domain "/?canceled=true")})]
               
               (-> (.create (.-sessions (.-checkout stripe)) session-params)
                   (.then (fn [session]
                            (.json res #js {:url (.-url session)})))
                   (.catch (fn [err]
                             (js/console.error "Stripe Error:" err)
                             (.status res 500)
                             (.json res #js {:error (.-message err)})))))))
    app))

(defn main [& args]
  (let [app (create-app)]
    (.listen app port
             #(js/console.log (str "Server running on port " port)))))

;; For shadow-cljs hot reloading
(defn ^:dev/after-load start []
  (js/console.log "Server code reloaded."))
