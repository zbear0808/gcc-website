# Plan to Resolve FaqPage.tsx Anti-Pattern

## Issue Description
`FaqPage.tsx` currently contains anti-patterns around data processing and list keying:
1. **Runtime String Splitting**: Multi-line FAQ answers (`faq.a`) are formatted as strings containing newline `\n` characters and split at render time via `faq.a.split('\n')`. This introduces redundant string parsing and array creation on every render when items expand/collapse.
2. **Index as React Key**: The split answer lines use array indices (`key={i}`) as keys in React's `.map()`. Using index keys for dynamically generated arrays is an anti-pattern that can cause DOM reconciliation issues.
3. **List Keying**: The top-level FAQ list items also use array indices (`key={idx}`) instead of unique identifiers or stable properties.

## Proposed Resolution

### 1. Structure FAQ Data with Pre-Parsed Paragraph Arrays & Unique IDs
Update the `faqs` structure in `src/pages/FaqPage.tsx` so that:
- Each FAQ item includes a unique `id` property for stable React list keys (`key={faq.id}`).
- Answer content `a` is pre-formatted as an array of paragraph strings (`string[]`), eliminating runtime `split('\n')`.

```tsx
interface FaqItem {
  id: string;
  q: string;
  a: string[];
}

const faqs: FaqItem[] = [
  {
    id: 'stock-orange-emerald',
    q: 'When will you get orange and emerald shells in stock?',
    a: ['Idk, it depends on when I find decent deals to buy controllers for parts.']
  },
  {
    id: '3d-models',
    q: 'Where can I find the 3d models for your prints?',
    a: ['GitHub']
  },
  {
    id: 'free-shipping',
    q: 'Do you have free shipping?',
    a: [
      "Nope* (one exception), I'm not a big company like Amazon, just working out of my studio apartment, I'll always select the cheapest shipping I can get with USPS.",
      "*However, if you live in Seattle and go to locals you can pick up your controller in person at a tournament."
    ]
  },
  {
    id: 'returns',
    q: 'Do you accept returns?',
    a: ["No, returns are just really hard to deal with, and after shipping back and forth it's not really worth it."]
  },
  {
    id: 'warranty-general',
    q: 'Is there a warranty?',
    a: [
      "Yes, you get 10 days to bring up any issues with it. I'll only cover defects from my manufacturing and / or any damage suffered during shipping.",
      "It's only such a short window since I hand test each controller for at least 30 minutes to ensure everything is working properly.",
      "Additionally, for 6 months I will make any repairs to controllers for free, but the purchaser will have to pay for shipping and any replacement parts. You won't be charged for any labor, relubing, gluing, or maintenance cleaning."
    ]
  },
  {
    id: 'warranty-oem-parts',
    q: 'Is there a warranty on OEM parts?',
    a: ["No, there is no warranty on OEM parts (like OEM cables or shells). The only way to obtain these parts is by salvaging them from used controllers, so I have no way to test their long-term durability or how heavily used they were previously. For cables specifically, I always recommend buying an additional new backup cable just in case."]
  }
];
```

### 2. Update Component Rendering Logic & Key Assignment
Update `FaqPage` component to:
- Use `faq.id` as the top-level list key (`key={faq.id}`) instead of index `idx`.
- Map directly over `faq.a` without runtime `.split('\n')`.
- Provide stable keys for paragraph elements (e.g. `${faq.id}-p-${pIdx}` or paragraph text).

```tsx
export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="faq-page">
      <h1>Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqs.map((faq, idx) => (
          <div key={faq.id} className={`faq-item ${openIdx === idx ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
              {faq.q}
            </button>
            {openIdx === idx && (
              <div className="faq-a">
                {faq.a.map((paragraph, pIdx) => (
                  <p key={`${faq.id}-p-${pIdx}`}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Benefits & Impact
- **Eliminates Runtime Overhead**: Removes unnecessary string splitting and array construction during component render cycles.
- **Stable React Keys**: Guarantees unique, stable identifiers across renders, preventing potential DOM re-creation bugs.
- **Maintainability**: Makes answer paragraph structure clear and readable in code.
