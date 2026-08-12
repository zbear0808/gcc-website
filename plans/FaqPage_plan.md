# Plan to Resolve FaqPage.tsx Anti-Pattern

## Issue Description
`FaqPage.tsx` currently uses runtime string splitting (`faq.a.split('\n')`) on every render to separate paragraphs for the FAQ answers. It also maps these dynamically generated array elements using their array index as a key. This is an anti-pattern as it unnecessarily recalculates the array on each render and relies on array index keys for dynamically generated arrays. A better architectural approach is to pre-format the data source as an array of strings per answer.

## Proposed Changes

### 1. Refactor the `faqs` Data Structure
Update the `faqs` array so that the `a` (answer) property is an array of strings instead of a single string. Multi-paragraph answers separated by `\n` will become multiple string elements in the array.

**Code Snippet (`src/pages/FaqPage.tsx`):**
```tsx
const faqs = [
  {
    q: 'When will you get orange and emerald shells in stock?',
    a: ['Idk, it depends on when I find decent deals to buy controllers for parts.']
  },
  {
    q: 'Where can I find the 3d models for your prints?',
    a: ['GitHub']
  },
  {
    q: 'Do you have free shipping?',
    a: [
      "Nope* (one exception), I'm not a big company like Amazon, just working out of my studio apartment, I'll always select the cheapest shipping I can get with USPS.",
      "*However, if you live in Seattle and go to locals you can pick up your controller in person at a tournament."
    ]
  },
  {
    q: 'Do you accept returns?',
    a: ["No, returns are just really hard to deal with, and after shipping back and forth it's not really worth it."]
  },
  {
    q: 'Is there a warranty?',
    a: [
      "Yes, you get 10 days to bring up any issues with it. I'll only cover defects from my manufacturing and / or any damage suffered during shipping.",
      "It's only such a short window since I hand test each controller for at least 30 minutes to ensure everything is working properly.",
      "Additionally, for 6 months I will make any repairs to controllers for free, but the purchaser will have to pay for shipping and any replacement parts. You won't be charged for any labor, relubing, gluing, or maintenance cleaning."
    ]
  },
  {
    q: 'Is there a warranty on OEM parts?',
    a: ["No, there is no warranty on OEM parts (like OEM cables or shells). The only way to obtain these parts is by salvaging them from used controllers, so I have no way to test their long-term durability or how heavily used they were previously. For cables specifically, I always recommend buying an additional new backup cable just in case."]
  }
];
```

### 2. Update the Rendering Logic
Remove the runtime `.split('\n')` operation in the component's JSX. Since the data is now pre-formatted as an array of strings, we can directly map over `faq.a`. To resolve the index key issue, we can use the paragraph string itself as the key (or a combination of it if necessary, though these paragraphs are unique per answer).

**Code Snippet (`src/pages/FaqPage.tsx`):**
```tsx
// Inside FaqPage component...
            {openIdx === idx && (
              <div className="faq-a">
                {faq.a.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            )}
```

## Reasoning
- **Performance / Cleanliness**: Pre-formatting the text into an array avoids the `.split('\n')` string manipulation on every re-render when a user opens or closes an FAQ item.
- **Key Stability**: Using the paragraph text as a `key` is more stable and explicit than using the array index on dynamically split elements. Since paragraphs in an answer are unique, the text itself serves as an excellent React key.
- **Maintainability**: The `faqs` array becomes easier to read and maintain as multiple paragraphs are explicitly defined as array items, avoiding long string concatenations with escape characters like `\n`.
