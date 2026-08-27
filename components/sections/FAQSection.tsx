'use client';

import React, { useState } from 'react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: 'How long is the auction?', a: '72 hours.' },
    {
      q: "What happens if I'm outbid?",
      a: 'You can bid again while the auction is live.',
    },
    {
      q: 'When does my logo appear?',
      a: 'Once your paid bid is confirmed and becomes the highest bid.',
    },
    {
      q: 'When does the sticker go on the laptop?',
      a: 'The winning sticker is installed within 72 hours after the auction closes.',
    },
    {
      q: 'What currency can I use?',
      a: 'USD.',
    },
  ];

  return (
    <section id="faq" className="py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-8">FAQ</h2>
        <div className="border-t border-[#1a1a1a]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.q} className="border-b border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-4 text-left flex items-center justify-between gap-4 text-[15px] text-white"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#6d6d68] text-lg leading-none">{isOpen ? '–' : '+'}</span>
                </button>
                {isOpen && (
                  <p className="pb-4 text-sm text-[#8a8a84] -mt-1">{faq.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
