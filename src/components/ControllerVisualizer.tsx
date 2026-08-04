import React from 'react';
import { useStore } from '@/store/useStore';

const ControllerVisualizer: React.FC = () => {
  const config = useStore((state) => state.config);
  
  const shellColor = `var(--shell-${config.shell || 'oem'})`;

  const hasFirefox = config.notchesFirefox || false;
  const hasWavedash = config.notchesWavedash || false;
  const hasTriggerPlugs = config.triggerPlugs || false;
  const hasKalihChoco = config.kalihChoco || false;
  
  const triggerClass = hasTriggerPlugs ? 'has-plugs' : hasKalihChoco ? 'has-choco' : '';

  // Calculate plug color
  let plugColor = shellColor; // OEM default
  let isParacord = false;

  if (config.cable === 'cable-3rd-party-3m') {
    plugColor = 'var(--shell-indigo)';
  } else if (config.cable === 'cable-paracord-3m') {
    plugColor = '#222'; // black
    isParacord = true;
  }

  return (
    <div className="visualizer-wrapper">
      <div className={`controller-map ${config.buttons ? `theme-${config.buttons}` : ''}`}>
        {/* Left Trigger */}
        <div className={`trigger trigger-l ${triggerClass}`}></div>
        {/* Right Trigger */}
        <div className={`trigger trigger-r ${triggerClass}`}></div>

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
          <div className={`stick stick-left ${hasFirefox ? 'has-firefox' : ''} ${hasWavedash ? 'has-wavedash' : ''}`}>
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
      </div>
    </div>
  );
};

export default ControllerVisualizer;
