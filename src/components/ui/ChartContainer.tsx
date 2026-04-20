'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ title, description, children, className }: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </CardHeader>
      <CardContent className="min-h-80 md:min-h-96 lg:min-h-[400px] w-full mt-4">
        {children}
      </CardContent>
    </Card>
  );
}
