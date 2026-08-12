# Resolution Plan: Header.tsx

## Issues to Resolve
- **Accessibility (a11y) Anti-patterns**: Add `role="button"`, `tabIndex={0}`, and keyboard event listeners (`onKeyDown`) to clickable `div` and `span` elements to ensure full keyboard navigation support.
- **Inconsistent Icon Management**: Move hardcoded Menu and Close icons to the centralized `Icons.tsx` component instead of injecting raw SVG paths directly in the header.
- **Repeated Inline Styles**: Refactor repeated `style={{ cursor: 'pointer' }}` into a shared CSS class or standard interaction states.
