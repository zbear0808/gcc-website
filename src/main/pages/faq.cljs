(ns main.pages.faq
  (:require
   [helix.core :refer [defnc $]]
   [helix.dom :as d]))

(defnc faq-item [{:keys [q a note]}]
  (d/div {:style {:margin-bottom "2rem"
                  :padding "1.5rem"
                  :border-radius "8px"
                  :background "var(--surface-color, #1a1a1a)"
                  :border "1px solid var(--border-color, #333)"}}
    (d/h3 {:style {:margin-top "0" :margin-bottom "1rem" :color "var(--primary-color, #fff)"}} q)
    (d/p {:style {:margin "0" :line-height "1.6" :color "var(--text-color, #ccc)"}} a)
    (when note
      (d/p {:style {:margin "1rem 0 0 0" :font-size "0.9rem" :font-style "italic" :color "var(--text-muted, #999)"}} note))))

(defnc faq-page []
  (d/div {:class "faq-page"
          :style {:max-width "800px"
                  :margin "0 auto"
                  :padding "2rem"}}
    (d/h1 {:style {:margin-bottom "2rem" :text-align "center" :font-size "2.5rem"}} "Frequently Asked Questions")
    
    (d/div {:class "faq-list"}
      ($ faq-item 
         {:q "When will you get orange and emerald shells in stock?"
          :a "Idk, it depends on when I find decent deals to buy controllers for parts."})
      
      ($ faq-item 
         {:q "Where can I find the 3d models for your prints?"
          :a "GitHub"})
          
      ($ faq-item 
         {:q "Do you have free shipping?"
          :a "Nope* (one exception), I'm not a big company like Amazon, just working out of my studio apartment, I'll always select the cheapest shipping I can get with USPS."
          :note "*However, if you live in Seattle and go to locals you can pick up your controller in person at a tournament."})
          
      ($ faq-item 
         {:q "Do you accept returns?"
          :a "No, returns are just really hard to deal with, and after shipping back and forth it's not really worth it."})
          
      ($ faq-item 
         {:q "Is there a warranty?"
          :a "Yes, you get 10 days to bring up any issues with it. I'll only cover defects from my manufacturing and / or any damage suffered during shipping."
          :note "It's only such a short window since I hand test each controller for at least 30 minutes to ensure everything is working properly."}))))
