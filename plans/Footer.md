# Plan to Resolve Footer.tsx Hardcoded URLs Issue

## Issue Description
`Footer.tsx` currently contains hardcoded URLs directly within the component's JSX markup:
- GitHub Repository URL: `https://github.com/gcc-controllers`
- Contact Email: `mailto:contact@gcccontrollers.com`

Hardcoding site configuration details directly inside UI components creates maintenance overhead and inconsistencies across the codebase if links change or need to be updated. It also prevents environment-based configuration (e.g., staging vs. production repository or support email address).

## Proposed Changes

### 1. Create a Centralized Site Configuration Constants File
Create a new configuration file at `src/constants/siteConfig.ts` to centralize site links, contact information, and metadata. Fallback defaults are provided, with support for environment variable overrides via Vite's `import.meta.env`.

**Code Snippet (`src/constants/siteConfig.ts`):**
```typescript
export const SITE_CONFIG = {
  githubUrl: import.meta.env.VITE_GITHUB_URL || 'https://github.com/gcc-controllers',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'contact@gcccontrollers.com',
};
```

### 2. Refactor `Footer.tsx` to Consume Configuration
Import `SITE_CONFIG` into `Footer.tsx` and dynamically populate the `href` attributes.

**Code Snippet (`src/components/Footer.tsx`):**
```tsx
import React from 'react';
import { GitHubIcon, EmailIcon } from './Icons';
import { SITE_CONFIG } from '@/constants/siteConfig';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a 
          href={SITE_CONFIG.githubUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <GitHubIcon />
        </a>
        <a 
          href={`mailto:${SITE_CONFIG.contactEmail}`}
          aria-label="Email"
        >
          <EmailIcon />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
```

## Reasoning
- **Single Source of Truth**: Centralizing link definitions ensures contact info and repository links are easy to manage and update across the entire application.
- **Environment Flexibility**: Utilizing `import.meta.env` allows easy override for development/staging environments without modifying component logic.
- **Separation of Concerns**: Decouples presentation logic from configuration data, adhering to clean architecture practices.
