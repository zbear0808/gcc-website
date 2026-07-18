(ns server.core
  (:require
   ["stripe" :as Stripe]
   ["@upstash/redis" :refer [Redis]]
   [main.pricing :as pricing]))

(def stripe (Stripe (.-STRIPE_SECRET_KEY js/process.env)))

(def redis
  (if (and (.-KV_REST_API_URL js/process.env) (.-KV_REST_API_TOKEN js/process.env))
    (new Redis #js {:url (.-KV_REST_API_URL js/process.env)
                    :token (.-KV_REST_API_TOKEN js/process.env)})
    nil))

(defn handle-checkout [req res]
  (let [body (.-body req)
        config (js->clj body :keywordize-keys true)
        
        domain (if (.-VERCEL_PROJECT_PRODUCTION_URL js/process.env)
                 (str "https://" (.-VERCEL_PROJECT_PRODUCTION_URL js/process.env))
                 "http://localhost:5000") 
        
        line-items (if (:is-parts config)
                     (pricing/get-parts-line-items (:cart config))
                     (pricing/get-line-items config))
        
        ;; Create Stripe Session
        session-params (clj->js {:payment_method_types ["card"]
                                 :line_items line-items
                                 :mode "payment"
                                 ;; We store the config as metadata to deduct inventory later
                                 :metadata {:config (js/JSON.stringify (clj->js config))}
                                 :success_url (str domain "/?success=true")
                                 :cancel_url (str domain "/?canceled=true")})]
    
    (-> (.create (.-sessions (.-checkout stripe)) session-params)
        (.then (fn [session]
                 (.json res #js {:url (.-url session)})))
        (.catch (fn [err]
                  (js/console.error "Stripe Error:" err)
                  (.status res 500)
                  (.json res #js {:error (.-message err)}))))))

(defn handle-get-inventory [res]
  (if (or (.-USE_FALLBACK_INVENTORY js/process.env) (not redis))
    ;; NOTE: This fallback inventory is strictly for local testing 
    ;; so the backend can be developed more easily without Redis.
    ;; It uses dummy values (10 stock for all items).
    (let [all-items (concat pricing/products pricing/shells pricing/buttons pricing/mods pricing/addons pricing/parts)
          fallback-inventory (reduce (fn [acc item] (assoc acc (:id item) 10)) {} all-items)]
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
  (if-not redis
    (.json res #js {:error "Redis not configured"})
    (let [updates (js->clj (.-body req))]
      (-> (.hset redis "inventory" updates)
          (.then (fn [_] (.json res #js {:success true})))
          (.catch (fn [err]
                    (js/console.error "Redis Error:" err)
                    (.status res 500)
                    (.json res #js {:error "Failed to update inventory"})))))))

(defn get-all-items-from-config [config]
  (let [items (transient [])]
    (if (:is-parts config)
      ;; Parts cart
      (doseq [[part-id quantity] (:cart config)]
        (dotimes [_ quantity]
          (conj! items (keyword part-id))))
      ;; Controller build config
      (let [{:keys [product shell buttons notches-firefox? notches-wavedash? trigger-plugs? spring-cut?]} config
            items (conj! items (keyword product))]
        (when (pricing/full-build? config)
          (when shell (conj! items (keyword shell)))
          (when buttons (conj! items (keyword buttons)))
          (when notches-firefox? (conj! items :notches-firefox?))
          (when notches-wavedash? (conj! items :notches-wavedash?))
          (when trigger-plugs? (conj! items :trigger-plugs?))
          (when spring-cut? (conj! items :spring-cut?)))
        items))
    (persistent! items)))

(defn handle-stripe-webhook [req res]
  (let [event (js->clj (.-body req) :keywordize-keys true)]
    (if (= (:type event) "checkout.session.completed")
      (let [session (:data (:object event))
            metadata (:metadata session)]
        (if-let [config-str (:config metadata)]
          (let [config (js->clj (js/JSON.parse config-str) :keywordize-keys true)
                items-purchased (get-all-items-from-config config)]
            (if redis
              ;; Decrement each item's inventory
              (let [promises (map (fn [item] (.hincrby redis "inventory" (name item) -1)) items-purchased)]
                (-> (js/Promise.all (clj->js promises))
                    (.then (fn [_] (.json res #js {:received true})))
                    (.catch (fn [err]
                              (js/console.error "Redis Error:" err)
                              (.status res 500)
                              (.json res #js {:error "Failed to decrement inventory"})))))
              (.json res #js {:received true})))
          (.json res #js {:received true})))
      (.json res #js {:received true}))))

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
