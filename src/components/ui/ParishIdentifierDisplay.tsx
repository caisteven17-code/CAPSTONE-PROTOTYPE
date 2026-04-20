'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface ParishIdentifierDisplayProps {
  name: string;
  district?: string;
  vicariate?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

export function ParishIdentifierDisplay({
  name,
  district,
  vicariate,
  size = 'medium',
  showIcon = true,
  className = '',
}: ParishIdentifierDisplayProps) {
  const sizeStyles = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {showIcon && (
        <MapPin className={`${iconSizes[size]} text-gold-600 flex-shrink-0 mt-0.5`} />
      )}
      <div className={sizeStyles[size]}>
        <div className="font-bold text-gray-900">{name}</div>
        {(district || vicariate) && (
          <div className="text-gray-600 text-opacity-75">
            {district && vicariate ? (
              <span>{district} • {vicariate}</span>
            ) : district ? (
              <span>{district}</span>
            ) : vicariate ? (
              <span>{vicariate}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Utility function to generate full identifier string
 * Usage: generateFullIdentifier("St. Matthew's", "District 1", "Holy Family")
 * Output: "St. Matthew's • District 1 • Holy Family"
 */
export function generateFullIdentifier(
  name: string,
  district?: string,
  vicariate?: string
): string {
  const parts = [name];
  if (district) parts.push(district);
  if (vicariate) parts.push(vicariate);
  return parts.join(' • ');
}
