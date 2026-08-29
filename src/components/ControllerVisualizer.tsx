import React from 'react';
import { useStore } from '@/store/useStore';
import styles from '@/assets/styles/components/visualizer.module.css';

interface Props {
  isMinimized?: boolean;
}

const ControllerVisualizer: React.FC<Props> = ({ isMinimized = false }) => {
  const config = useStore((state) => state.config);

  const shellColor = `var(--shell-${config.shell || 'oem'})`;

  const hasFirefox = config.notchesFirefox || false;
  const hasWavedash = config.notchesWavedash || false;
  const hasTriggerPlugs = config.triggerPlugs || false;
  const triggerPlugSide = config.triggerPlugSide || 'both';
  const haskailhChoco = config.kailhChoco || false;

  const leftTriggerClass = hasTriggerPlugs && (triggerPlugSide === 'both' || triggerPlugSide === 'l') ? styles['has-plugs'] : haskailhChoco ? styles['has-choco'] : '';
  const rightTriggerClass = hasTriggerPlugs && (triggerPlugSide === 'both' || triggerPlugSide === 'r') ? styles['has-plugs'] : haskailhChoco ? styles['has-choco'] : '';

  // Calculate plug color
  let plugColor = shellColor; // OEM default
  let isParacord = false;

  if (config.cable === 'cable-3rd-party-3m') {
    plugColor = 'var(--shell-indigo)';
  } else if (config.cable === 'cable-paracord-3m') {
    plugColor = '#222'; // black
    isParacord = true;
  }

  const isDIY = config.product === 'diy-kit' || config.product === '0-solder-diy-kit';

  return (
    <div className={`${styles['visualizer-wrapper']} ${isMinimized ? styles['is-minimized'] : ''} glass-panel`}>
      <div className={`${styles['controller-map']} ${config.buttons ? styles[`theme-${config.buttons}`] : ''}`}>
        {isDIY ? (
          <div className={styles['phob-pcb']}>
            {config.cable && (
              <div className={`${styles['cord-container']} ${styles['pcb-cord']}`}>
                <div className={`${styles['cord']} ${isParacord ? styles['paracord'] : ''}`}></div>
                <div className={styles['plug']} style={{ backgroundColor: plugColor }}>
                  <div className={styles['plug-details']}></div>
                </div>
              </div>
            )}
            <div className={styles['pcb-board']}>
              <svg className={styles['pcb-svg']} width="280" height="200" viewBox="0 0 280 200">
                <defs>
                  <filter id="pcb-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>
                <path
                  d="M 50 10 L 230 10 A 40 40 0 0 1 270 50 L 270 130 A 50 50 0 0 1 170 130 L 170 110 A 30 30 0 0 0 110 110 L 110 140 A 50 50 0 0 1 10 140 L 10 50 A 40 40 0 0 1 50 10 Z"
                  fill="#f0f0f0"
                  stroke="#ddd"
                  strokeWidth="2"
                  filter="url(#pcb-shadow)"
                />
              </svg>

              <div className={styles['pcb-chip']}></div>
              <div className={styles['pcb-chip-small']}></div>
              <div className={styles['pcb-start-pad']}></div>

              <div className={styles['pcb-stick-box-left']}></div>

              <div className={styles['pcb-ribbon-cable']}></div>
              <div className={styles['pcb-daughterboard']}>
                <div className={styles['pcb-stick-box-c']}></div>
              </div>

              <div className={`${styles['pcb-button-pad']} ${styles['pad-a']}`}></div>
              <div className={`${styles['pcb-button-pad']} ${styles['pad-b']}`}></div>
              <div className={`${styles['pcb-button-pad']} ${styles['pad-x']}`}></div>
              <div className={`${styles['pcb-button-pad']} ${styles['pad-y']}`}></div>

              <div className={`${styles['pcb-button-pad']} ${styles['pad-dup']}`}></div>
              <div className={`${styles['pcb-button-pad']} ${styles['pad-ddown']}`}></div>
              <div className={`${styles['pcb-button-pad']} ${styles['pad-dleft']}`}></div>
              <div className={`${styles['pcb-button-pad']} ${styles['pad-dright']}`}></div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Trigger */}
            <div className={`${styles['trigger']} ${styles['trigger-l']} ${leftTriggerClass || ''}`}></div>
            {/* Right Trigger */}
            <div className={`${styles['trigger']} ${styles['trigger-r']} ${rightTriggerClass || ''}`}></div>

            <div
              className={styles['controller-body']}
              style={{ backgroundColor: shellColor }}
            >
              {/* Cord */}
              {config.cable && (
                <div className={styles['cord-container']}>
                  <div className={`${styles['cord']} ${isParacord ? styles['paracord'] : ''}`}></div>
                  <div className={styles['plug']} style={{ backgroundColor: plugColor }}>
                    <div className={styles['plug-details']}></div>
                  </div>
                </div>
              )}

              {/* Left Pod */}
              <div className={styles['controller-pod-left']} style={{ backgroundColor: shellColor }}></div>

              {/* Right Pod */}
              <div className={styles['controller-pod-right']} style={{ backgroundColor: shellColor }}></div>

              {/* Left Handle */}
              <div className={styles['controller-handle-left']} style={{ backgroundColor: shellColor }}></div>

              {/* Right Handle */}
              <div className={styles['controller-handle-right']} style={{ backgroundColor: shellColor }}></div>

              {/* D-Pad */}
              <div className={styles['d-pad']}></div>

              {/* Left Stick */}
              <div className={`${styles['stick']} ${styles['stick-left']} ${hasFirefox ? styles['has-firefox'] : ''} ${hasWavedash ? styles['has-wavedash'] : ''} ${styles[`notch-style-${config.notchStyle || 'deep'}`] || ''}`}>
                <div className={styles['notch-indicator']}></div>
              </div>

              {/* C-Stick (Yellow) */}
              <div className={`${styles['stick']} ${styles['stick-c']}`}></div>

              {/* Button Cluster */}
              <div className={styles['button-group']}>
                <div className={`${styles['btn-v']} ${styles['btn-a']}`}>A</div>
                <div className={`${styles['btn-v']} ${styles['btn-b']}`}>B</div>
                <div className={`${styles['btn-v']} ${styles['btn-x']}`}>X</div>
                <div className={`${styles['btn-v']} ${styles['btn-y']}`}>Y</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ControllerVisualizer;
