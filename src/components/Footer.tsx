import React from 'react';
import { GitHubIcon, EmailIcon } from './Icons';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a 
          href="https://github.com/gcc-controllers" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <GitHubIcon />
        </a>
        <a 
          href="mailto:contact@gcccontrollers.com"
          aria-label="Email"
        >
          <EmailIcon />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
