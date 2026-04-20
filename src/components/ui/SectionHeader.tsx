'use client';

import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <h2 className="text-xl font-bold text-church-black tracking-tight">{title}</h2>
      {description && <p className="text-sm text-church-grey mt-1">{description}</p>}
    </div>
  );
}
