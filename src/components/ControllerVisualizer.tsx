import React from 'react';
import { useStore } from '@/store/useStore';

const ControllerVisualizer: React.FC = () => {
  const config = useStore((state) => state.config);
  
  const shellColor = `var(--shell-${config.shell || 'oem'})`;

  const hasFirefox = config.mods?.includes('firefox-notches') || false;
  const hasWavedash = config.mods?.includes('wavedash-notches') || false;
  const hasTriggerPlugs = config.mods?.includes('trigger-plugs') || false;

  return (
    <div className="visualizer-wrapper">
      <div className="controller-map">
        {/* Left Trigger */}
        <div className={`trigger-l ${hasTriggerPlugs ? 'has-plugs' : ''}`}></div>
        {/* Right Trigger */}
        <div className={`trigger-r ${hasTriggerPlugs ? 'has-plugs' : ''}`}></div>

        <div 
          className="controller-body" 
          style={{ backgroundColor: shellColor }}
        >
          {/* Left Handle */}
          <div className="handle-l" style={{ backgroundColor: shellColor }}></div>
          
          {/* Right Handle */}
          <div className="handle-r" style={{ backgroundColor: shellColor }}></div>
          
          {/* D-Pad */}
          <div className="d-pad"></div>
          
          {/* Left Stick */}
          <div className={`stick-l ${hasFirefox ? 'has-firefox' : ''} ${hasWavedash ? 'has-wavedash' : ''}`}></div>
          
          {/* C-Stick (Yellow) */}
          <div className="stick-c" style={{ backgroundColor: 'yellow' }}></div>
          
          {/* Button Cluster */}
          <div className="button-cluster">
            <div className="btn-a" style={{ backgroundColor: 'green' }}>A</div>
            <div className="btn-b" style={{ backgroundColor: 'red' }}>B</div>
            <div className="btn-x" style={{ backgroundColor: 'gray' }}>X</div>
            <div className="btn-y" style={{ backgroundColor: 'gray' }}>Y</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerVisualizer;
