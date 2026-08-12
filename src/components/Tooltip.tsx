import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import '@/assets/styles/components/tooltip.css';

interface TooltipProps {
  content?: string | null;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <div
      className="tooltip-container"
      ref={containerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="tooltip-popup">
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
