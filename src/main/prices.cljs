(ns main.prices)

(def products
  [{:id :diy-kit
    :label "DIY Kit"
    :description "Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. THIS IS FOR DIY, parts do not come soldered on"
    :price 45
    :image "/images/products/diy-kit.png"}
   {:id :0-solder-diy-kit
    :label "0-Solder DIY Kit"
    :description "Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. All components are pre-soldered, you just need to mount the stickboxes and magnets and calibrate."
    :price 79
    :image "/images/products/diy-kit-no-solder.png"}
   {:id :full-build
    :label "PhobGCC Full Build"
    :description "Complete controller with T3 stickboxes — choose your shell and mods."
    :price 99
    :image "/images/products/full-build.png"}])

(def mods
  [{:id :notches-firefox? :label "Firefox Notches" :price 40 :image "/images/mods/firefox.png"}
   {:id :notches-wavedash? :label "Wavedash Notches" :price 20 :image "/images/mods/wavedash.png"}])

(def addons
  [{:id :trigger-plugs? :label "Trigger Plugs" :image "/images/addons/trigger-plugs.png"}
   {:id :spring-cut? :label "Cut Springs" :image "/images/addons/cut-springs.png"}])

(def shells
  [{:id :cherry :label "Cherry Blossom" :type :extremerate :price 0 :individual-price 15 :image "/images/shells/cherry.png"}
   {:id :white :label "White" :type :extremerate :price 0 :individual-price 15 :image "/images/shells/white.png"}
   {:id :clear :label "Clear" :type :extremerate :price 0 :individual-price 15 :image "/images/shells/clear.png"}
   {:id :indigo :label "Indigo" :type :oem :price 5 :individual-price 15 :image "/images/shells/indigo.png"}
   {:id :black :label "Black" :type :oem :price 5 :individual-price 15 :image "/images/shells/black.png"}
   {:id :smash-ultimate-black :label "Smash Ultimate Black" :type :oem :price 5 :individual-price 20 :image "/images/shells/black.png"}
   {:id :platinum :label "Platinum" :type :oem :price 5 :individual-price 20 :image "/images/shells/platinum.png"}
   {:id :orange :label "Spice Orange" :type :oem :price 10 :individual-price 25 :image "/images/shells/orange.png"}
   {:id :emerald :label "Emerald Blue" :type :oem :price 20 :individual-price 45 :image "/images/shells/emerald.png"}])

(def cables
  [{:id :cable-3rd-party-3m :label "3rd Party 3m" :description "Brand new. Has an indigo plug and no metal shielding under the rubber sleeve." :price 0 :individual-price 5 :image "/images/parts/cable-3rd-party.png"}
   {:id :cable-paracord-3m :label "Detachable Black Paracord 3m (JST header)" :description "Brand new with metal shielding." :price 15 :individual-price 22 :image "/images/parts/cable-paracord.png"}
   {:id :cable-oem :label "OEM Cable (2m, or 3m for Smash Ultimate Black)" :description "All used." :price 0 :image "/images/parts/cable-oem.png"}])

(def buttons
  [{:id :oem-buttons :label "OEM Buttons" :type :oem :price 0 :individual-price 5 :image "/images/buttons/oem.png"}
   {:id :gray-buttons :label "Gray Buttons" :type :extremerate :price 0 :individual-price 5 :image "/images/buttons/gray.png"}
   {:id :white-buttons :label "White Buttons" :type :extremerate :price 5 :individual-price 10 :image "/images/buttons/white.png"}
   {:id :chrome-buttons :label "Chrome Buttons" :type :extremerate :price 5 :individual-price 10 :image "/images/buttons/chrome.png"}])

(def rumbles
  [{:id :rumble-none :label "No Rumble Motor" :price 0 :image "/images/parts/rumble-none.png"}
   {:id :rumble-oem :label "OEM Rumble Motor" :price 3 :individual-price 10 :image "/images/parts/rumble-oem.png"}
   {:id :rumble-non-oem :label "Non-OEM Rumble Motor" :price 0 :individual-price 1 :image "/images/parts/rumble-non-oem.png"}])

(def slider-pots
  [{:id :slider-pot-alps :label "Alps Slider Potentiometers (Pack of 2)" :description "Replacement slide potentiometers for triggers. All slider potentiometers are relubricated with deox fader lubricant before shipping." :price 0 :individual-price 12 :image "/images/parts/slider-pot.png"}
   {:id :slider-pot-noble :label "Noble Slider Potentiometers (Pack of 2)" :description "Replacement slide potentiometers for triggers. All slider potentiometers are relubricated with deox fader lubricant before shipping." :price 2 :individual-price 14 :image "/images/parts/slider-pot.png"}])

(def z-buttons
  [{:id :tactile-z :label "Tactile Z Button" :description "Tactile switch for the Z button." :price 0 :individual-price 1 :image "/images/parts/tactile-z.png"}
   {:id :oem-z :label "OEM Z Button" :description "Softer, original style Z button." :price 0 :individual-price 1}])

(def membranes
  [{:id :membrane-extremerate :label "Extremerate Clear Rubber Membranes" :description "The most stiff and clicky ones." :price 0 :individual-price 1 :image "/images/parts/membrane-clear.png"}
   {:id :membrane-jcd :label "JCD Dark Grey Rubber Membranes" :description "In the middle, more clicky than OEM. (My personal preference)" :price 0 :individual-price 1 :image "/images/parts/membrane-dark-grey.png"}
   {:id :membrane-oem :label "OEM Rubber Membranes" :description "The most squishy ones." :price 0 :individual-price 1 :image "/images/parts/membrane-oem.png"}])

(def parts
  [{:id :board-only :label "PhobGCC Board Only" :description "Just the board" :price 0 :individual-price 20 :image "/images/products/board-only.png"}
   {:id :notch-ruler :label "Notch Ruler" :description "Guide tool to help with creating firefox and wavedash notches." :price 0 :individual-price 2 :image "/images/parts/notch-ruler.png"}
   {:id :stickbox :label "T3 Stickbox" :description "OEM T3 stickboxes cleaned with ipa and relubed with Shin Etsu silicone lubricant." :price 0 :individual-price 12 :image "/images/parts/stickbox.png"}
   {:id :stickbox-pot :label "Stickbox Potentiometers UNTESTED (Pack of 8)" :description "Untested OEM Noble brand potentiometers for stickboxes, can't guarantee that they can pivot, but from a random batch I tested most could." #_#_:price 1 :individual-price 2 :image "/images/parts/stickbox-pot.png"}
   {:id :wii-cap-new :label "OEM Wii Classic Stick Cap (New)" :description "OEM stick cap in like-new condition." :price 4 :individual-price 5 :image "/images/parts/wii-cap-new.png"}
   {:id :wii-cap-okay :label "OEM Wii Classic Stick Cap (Okay)" :description "OEM stick cap in okay condition." :price 2 :individual-price 3 :image "/images/parts/wii-cap-okay.png"}
   {:id :wii-cap-poor :label "OEM Wii Classic Stick Cap (Poor)" :description "OEM stick cap in poor condition." :price 1 :individual-price 2 :image "/images/parts/wii-cap-poor.png"}
   {:id :magnet-mount :label "Magnet Mounts (Pack of 4)" :description "Mounts for magnets used with Hall effect sensors." :price 0 :individual-price 2 :image "/images/parts/magnet-mount.png"}
   {:id :dh1212-magnet :label "DH1212 Magnets (Pack of 4)" :description "Magnets for use with Hall effect sensors." :price 1 :individual-price 2 :image "/images/parts/dh1212-magnet.png"}
   {:id :6-pin-ribbon-cable :label "6 pin ribbon cable" :description "Ribbon cable for connecting the main board to the C stick daughter board." :price 0 :individual-price 1 :image "/images/parts/ribbon-cable.png"}
   {:id :trigger-paddle-pcbs :label "Trigger Paddle PCBs (Pack of 2)" :description "PCBs for custom trigger paddles." :price 0 :individual-price 1 :image "/images/parts/trigger-paddle.png"}])

(def all-items
  (concat products shells buttons mods addons parts cables rumbles slider-pots z-buttons membranes))
