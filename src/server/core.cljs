(ns server.core
  (:require
   ["stripe" :as Stripe]
   ["@upstash/redis" :refer [Redis]]
   [main.pricing :as pricing]))

(def stripe (Stripe (.-STRIPE_SECRET_KEY js/process.env)))
(def endpoint-secret (.-STRIPE_WEBHOOK_SECRET js/process.env))

(def redis
  (if (and (.-KV_REST_API_URL js/process.env) (.-KV_REST_API_TOKEN js/process.env))
    (new Redis #js {:url (.-KV_REST_API_URL js/process.env)
                    :token (.-KV_REST_API_TOKEN js/process.env)})
    nil))

(defn check-inventory-available [requested-items]
  ;; requested-items is a map of {item-id quantity}
  (if (or (.-USE_FALLBACK_INVENTORY js/process.env) (not redis))
    (js/Promise.resolve true)
    (-> (.hgetall redis "inventory")
        (.then (fn [data]
                 (let [inventory (if data (js->clj data :keywordize-keys true) {})]
                   (reduce-kv (fn [acc item-id qty]
                                (let [stock (get inventory (keyword item-id) 0)]
                                  (if (> qty stock)
                                    (reduced false)
                                    acc)))
                              true
                              requested-items)))))))

(defn get-all-items-from-config [config]
  (let [{:keys [product shell buttons cable rumble slider-pots z-button notches-firefox? notches-wavedash? trigger-plugs? spring-cut?]} config]
    (cond-> [(keyword product)]
      (pricing/full-build? config)
      (into (keep identity
                  [(when shell (keyword shell))
                   (when buttons (keyword buttons))
                   (when cable (keyword cable))
                   (when rumble (keyword rumble))
                   (when slider-pots (keyword slider-pots))
                   (when z-button (keyword z-button))
                   (when notches-firefox? :notches-firefox?)
                   (when notches-wavedash? :notches-wavedash?)
                   (when trigger-plugs? :trigger-plugs?)
                   (when spring-cut? :spring-cut?)]))
      (pricing/diy-kit? config)
      (into (keep identity
                  [(when cable (keyword cable))
                   (when slider-pots (keyword slider-pots))
                   (when z-button (keyword z-button))])))))

(defn extract-requested-items [payload]
  (let [{:keys [config cart parts?]} payload
        items-map (if parts? (or cart {}) {})]
    (if (and config (:product config))
      (let [config-items (get-all-items-from-config config)]
        (reduce (fn [acc item]
                  (update acc (keyword item) (fnil inc 0)))
                items-map
                config-items))
      items-map)))

(defn handle-checkout [req res]
  (let [body (.-body req)
        payload (js->clj body :keywordize-keys true)
        config (when (:config payload) (pricing/sanitize-config (:config payload)))
        cart (or (:cart payload) {})
        
        domain (if (.-VERCEL_PROJECT_PRODUCTION_URL js/process.env)
                 (str "https://" (.-VERCEL_PROJECT_PRODUCTION_URL js/process.env))
                 "http://localhost:5000") 
        
        requested-items (extract-requested-items payload)]
        
    (-> (check-inventory-available requested-items)
        (.then (fn [available?]
                 (if-not available?
                   (do
                     (.status res 400)
                     (.json res #js {:error "One or more items are out of stock."}))
                   (let [config-line-items (if config (pricing/get-line-items config) [])
                         cart-line-items (if (:parts? payload) (pricing/get-parts-line-items cart) [])
                         line-items (into config-line-items cart-line-items)
                         
                         session-params (clj->js {:payment_method_types ["card"]
                                                  :line_items line-items
                                                  :mode "payment"
                                                  :metadata {:payload (js/JSON.stringify (clj->js payload))}
                                                  :success_url (str domain "/?success=true")
                                                  :cancel_url (str domain "/?canceled=true")})]
                     (-> (.create (.-sessions (.-checkout stripe)) session-params)
                         (.then (fn [session]
                                  (.json res #js {:url (.-url session)})))
                         (.catch (fn [err]
                                   (js/console.error "Stripe Error:" err)
                                   (.status res 500)
                                   (.json res #js {:error (.-message err)}))))))))
        (.catch (fn [err]
                  (js/console.error "Inventory Check Error:" err)
                  (.status res 500)
                  (.json res #js {:error "Failed to verify inventory"}))))))

(defn handle-get-inventory [res]
  (if (or (.-USE_FALLBACK_INVENTORY js/process.env) (not redis))
    (let [fallback-inventory (reduce (fn [acc item] (assoc acc (:id item) 10)) {} pricing/all-items)]
      (.json res (clj->js fallback-inventory)))
    (-> (.hgetall redis "inventory")
        (.then (fn [data]
                 (let [inventory (if data (js->clj data :keywordize-keys true) {})]
                   (.json res (clj->js inventory)))))
        (.catch (fn [err]
                  (js/console.error "Redis Error:" err)
                  (.status res 500)
                  (.json res #js {:error "Failed to fetch inventory"}))))))

(defn handle-post-inventory [req res]
  (let [admin-secret (.-ADMIN_SECRET js/process.env)
        req-secret (.header req "x-admin-secret")]
    (if (and admin-secret (not= admin-secret req-secret))
      (do
        (.status res 401)
        (.json res #js {:error "Unauthorized"}))
      (if-not redis
        (.json res #js {:error "Redis not configured"})
        (let [updates (js->clj (.-body req))]
          (-> (.hset redis "inventory" updates)
              (.then (fn [_] (.json res #js {:success true})))
              (.catch (fn [err]
                        (js/console.error "Redis Error:" err)
                        (.status res 500)
                        (.json res #js {:error "Failed to update inventory"})))))))))

(defn ^:export webhook-handler [req res]
  (let [sig (.-stripe-signature (.-headers req))
        raw-body (.-rawBody req)]
    (try
      (let [event (.constructEvent (.-webhooks stripe) raw-body sig endpoint-secret)
            event-clj (js->clj event :keywordize-keys true)]
        (if (= (:type event-clj) "checkout.session.completed")
          (let [session (:data (:object event-clj))
                metadata (:metadata session)]
            (if-let [payload-str (:payload metadata)]
              (let [payload (js->clj (js/JSON.parse payload-str) :keywordize-keys true)
                    items-purchased (extract-requested-items payload)]
                (if redis
                  (let [promises (map (fn [[item qty]] (.hincrby redis "inventory" (name item) (- qty))) items-purchased)]
                    (-> (js/Promise.all (clj->js promises))
                        (.then (fn [_] (.json res #js {:received true})))
                        (.catch (fn [err]
                                  (js/console.error "Redis Error:" err)
                                  (.status res 500)
                                  (.json res #js {:error "Failed to decrement inventory"})))))
                  (.json res #js {:received true})))
              (.json res #js {:received true})))
          (.json res #js {:received true})))
      (catch js/Error err
        (js/console.error "Webhook Signature Error:" (.-message err))
        (.status res 400)
        (.send res (str "Webhook Error: " (.-message err)))))))

(defn handle-stripe-webhook [req res]
  ;; This handles the old route if something hits it, but it's likely broken without raw body.
  (.status res 400)
  (.send res "Please use /api/webhooks/stripe instead"))

(defn ^:export handler [req res]
  (let [url (.-url req)
        method (.-method req)]
    (cond
      (and (= method "POST") (.includes url "/api/checkout"))
      (handle-checkout req res)
      
      (and (= method "GET") (.includes url "/api/inventory"))
      (handle-get-inventory res)
      
      (and (= method "POST") (.includes url "/api/inventory"))
      (handle-post-inventory req res)
      
      (and (= method "POST") (.includes url "/api/webhooks/stripe"))
      (handle-stripe-webhook req res)
      
      :else
      (do
        (.status res 404)
        (.json res #js {:error "Not found"})))))
