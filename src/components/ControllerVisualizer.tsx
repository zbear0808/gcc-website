import React from 'react';
import { useStore } from '@/store/useStore';

const ControllerVisualizer: React.FC = () => {
  const config = useStore((state) => state.config);
  
  const shellColor = `var(--shell-${config.shell || 'oem'})`;

  const hasFirefox = config.notchesFirefox || false;
  const hasWavedash = config.notchesWavedash || false;
  const hasTriggerPlugs = config.triggerPlugs || false;
  const triggerPlugSide = config.triggerPlugSide || 'both';
  const hasKalihChoco = config.kalihChoco || false;
  
  const leftTriggerClass = hasTriggerPlugs && (triggerPlugSide === 'both' || triggerPlugSide === 'l') ? 'has-plugs' : hasKalihChoco ? 'has-choco' : '';
  const rightTriggerClass = hasTriggerPlugs && (triggerPlugSide === 'both' || triggerPlugSide === 'r') ? 'has-plugs' : hasKalihChoco ? 'has-choco' : '';

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
    <div className="visualizer-wrapper">
      <div className={`controller-map ${config.buttons ? `theme-${config.buttons}` : ''}`}>
        {isDIY ? (
          <div className="phob-pcb">
            {config.cable && (
              <div className="cord-container pcb-cord">
                <div className={`cord ${isParacord ? 'paracord' : ''}`}></div>
                <div className="plug" style={{ backgroundColor: plugColor }}>
                  <div className="plug-details"></div>
                </div>
              </div>
            )}
            <div className="pcb-board">
              <svg className="pcb-svg" width="280" height="200" viewBox="0 0 280 200">
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
              
              <div className="pcb-chip"></div>
              <div className="pcb-chip-small"></div>
              <div className="pcb-start-pad"></div>
              
              <div className="pcb-stick-box-left"></div>
              
              <div className="pcb-ribbon-cable"></div>
              <div className="pcb-daughterboard">
                <div className="pcb-stick-box-c"></div>
              </div>
              
              <div className="pcb-button-pad pad-a"></div>
              <div className="pcb-button-pad pad-b"></div>
              <div className="pcb-button-pad pad-x"></div>
              <div className="pcb-button-pad pad-y"></div>
              
              <div className="pcb-button-pad pad-dup"></div>
              <div className="pcb-button-pad pad-ddown"></div>
              <div className="pcb-button-pad pad-dleft"></div>
              <div className="pcb-button-pad pad-dright"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Trigger */}
            <div className={`trigger trigger-l ${leftTriggerClass}`}></div>
            {/* Right Trigger */}
            <div className={`trigger trigger-r ${rightTriggerClass}`}></div>

            <div 
              className="controller-body" 
              style={{ backgroundColor: shellColor }}
            >
              {/* Cord */}
              {config.cable && (
                <div className="cord-container">
                  <div className={`cord ${isParacord ? 'paracord' : ''}`}></div>
                  <div className="plug" style={{ backgroundColor: plugColor }}>
                    <div className="plug-details"></div>
                  </div>
                </div>
              )}

              {/* Left Pod */}
              <div className="controller-pod-left" style={{ backgroundColor: shellColor }}></div>
              
              {/* Right Pod */}
              <div className="controller-pod-right" style={{ backgroundColor: shellColor }}></div>

              {/* Left Handle */}
              <div className="controller-handle-left" style={{ backgroundColor: shellColor }}></div>
              
              {/* Right Handle */}
              <div className="controller-handle-right" style={{ backgroundColor: shellColor }}></div>
              
              {/* D-Pad */}
              <div className="d-pad"></div>
              
              {/* Left Stick */}
              <div className={`stick stick-left ${hasFirefox ? 'has-firefox' : ''} ${hasWavedash ? 'has-wavedash' : ''} notch-style-${config.notchStyle || 'deep'}`}>
                <div className="notch-indicator"></div>
              </div>
              
              {/* C-Stick (Yellow) */}
              <div className="stick stick-c"></div>
              
              {/* Button Cluster */}
              <div className="button-group">
                <div className="btn-v btn-a">A</div>
                <div className="btn-v btn-b">B</div>
                <div className="btn-v btn-x">X</div>
                <div className="btn-v btn-y">Y</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ControllerVisualizer;
