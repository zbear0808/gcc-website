import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const EMAIL = 'contact@gcccontrollers.com';
const GITHUB = 'https://github.com/gcc-controllers';

const faqs: { id: string; q: string; a: ReactNode }[] = [
  {
    id: 'restock',
    q: 'When will you get orange and emerald shells in stock?',
    a: 'Idk, it depends on when I find decent deals to buy controllers for parts.',
  },
  {
    id: '3d-models',
    q: 'Where can I find the 3d models for your prints?',
    a: (
      <a href={GITHUB} target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    ),
  },
  {
    id: 'shipping',
    q: 'Do you have free shipping?',
    a: "Nope* (one exception), I'm not a big company like Amazon, just working out of my studio apartment, I'll always select the cheapest shipping I can get with USPS.\n*However, if you live in Seattle and go to locals you can pick up your controller in person at a tournament.",
  },
  {
    id: 'returns',
    q: 'Do you accept returns?',
    a: "No, returns are just really hard to deal with, and after shipping back and forth it's not really worth it.",
  },
  {
    id: 'warranty',
    q: 'Is there a warranty?',
    a: "Yes, you get 10 days to bring up any issues with it. I'll only cover defects from my manufacturing and / or any damage suffered during shipping.\nIt's only such a short window since I hand test each controller for at least 30 minutes to ensure everything is working properly.\nAdditionally, for 6 months I will make any repairs to controllers for free, but the purchaser will have to pay for shipping and any replacement parts. You won't be charged for any labor, relubing, gluing, or maintenance cleaning.",
  },
  {
    id: 'oem-warranty',
    q: 'Is there a warranty on OEM parts?',
    a: 'No, there is no warranty on OEM parts (like OEM cables or shells). The only way to obtain these parts is by salvaging them from used controllers, so I have no way to test their long-term durability or how heavily used they were previously. For cables specifically, I always recommend buying an additional new backup cable just in case.',
  },
];

function Answer({ a }: { a: ReactNode }) {
  if (typeof a !== 'string') return <p>{a}</p>;
  return (
    <>
      {a.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </>
  );
}

export default function FaqPage() {
  const { hash } = useLocation();
  const target = hash.slice(1);

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: 'start' });
    }
  }, [target]);

  return (
    <div className="page page-narrow faq-page">
      <h1 className="page-title">FAQ</h1>
      <p className="page-intro">The stuff people ask me most. If your question isn’t here, just email me.</p>

      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.id} id={faq.id} className="faq-item">
            <summary className="faq-q">{faq.q}</summary>
            <div className="faq-a">
              <Answer a={faq.a} />
            </div>
          </details>
        ))}
      </div>

      <div className="faq-contact">
        <h2>Still have a question?</h2>
        <p>
          Email me at <a href={`mailto:${EMAIL}`}>{EMAIL}</a> and I’ll get back to you.
        </p>
      </div>
    </div>
  );
}
