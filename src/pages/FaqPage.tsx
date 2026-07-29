import React, { useState } from 'react';
import '@/assets/styles/faq.css';

const faqs = [
  {
    q: 'When will you get orange and emerald shells in stock?',
    a: 'Idk, it depends on when I find decent deals to buy controllers for parts.'
  },
  {
    q: 'Where can I find the 3d models for your prints?',
    a: 'GitHub'
  },
  {
    q: 'Do you have free shipping?',
    a: "Nope* (one exception), I'm not a big company like Amazon, just working out of my studio apartment, I'll always select the cheapest shipping I can get with USPS.\n*However, if you live in Seattle and go to locals you can pick up your controller in person at a tournament."
  },
  {
    q: 'Do you accept returns?',
    a: "No, returns are just really hard to deal with, and after shipping back and forth it's not really worth it."
  },
  {
    q: 'Is there a warranty?',
    a: "Yes, you get 10 days to bring up any issues with it. I'll only cover defects from my manufacturing and / or any damage suffered during shipping.\nIt's only such a short window since I hand test each controller for at least 30 minutes to ensure everything is working properly."
  }
];

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="faq-page">
      <h1>Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqs.map((faq, idx) => (
          <div key={idx} className={`faq-item ${openIdx === idx ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
              {faq.q}
            </button>
            {openIdx === idx && (
              <div className="faq-a">
                {faq.a.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
