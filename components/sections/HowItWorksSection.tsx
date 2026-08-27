'use client';

import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Pick a spot',
      desc: 'Choose one of 10 spots on my laptop.',
    },
    {
      num: '02',
      title: 'Place your bid',
      desc: 'Your logo goes live on the website when your bid becomes active.',
    },
    {
      num: '03',
      title: 'Win the spot',
      desc: 'Highest bidder when the 72-hour auction ends gets the physical sticker.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-10">
          How it works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
          {steps.map((step) => (
            <div key={step.num}>
              <div className="font-mono text-[12px] text-[#c8f542] mb-3">{step.num}</div>
              <h3 className="text-lg text-white tracking-tight mb-2">{step.title}</h3>
              <p className="text-sm text-[#8a8a84] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] text-[#6d6d68]">
          Sticker installed on the laptop within 72 hours after the auction closes.
        </p>
      </div>
    </section>
  );
};
