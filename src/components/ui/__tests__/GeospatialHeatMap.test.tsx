import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GeospatialHeatMap } from '../GeospatialHeatMap';
import React from 'react';

// Mock Leaflet and React-Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: () => <div data-testid="geojson-layer" />,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    icon: vi.fn(),
  },
}));

describe('GeospatialHeatMap Memoization Benchmark', () => {
  const mockParishes = Array.from({ length: 200 }, (_, i) => ({
    id: `p${i}`,
    name: `Parish ${i}`,
    lat: 18.1 + Math.random() * 0.2,
    lng: -77.3 + Math.random() * 0.2,
    healthScore: Math.floor(Math.random() * 100),
    financialScore: Math.floor(Math.random() * 100),
    spiritualScore: Math.floor(Math.random() * 100),
    socialScore: Math.floor(Math.random() * 100),
    lastUpdated: '2024-01-01',
    priest: 'Fr. Test',
  }));

  it('measures re-render performance with memoization', () => {
    const { rerender } = render(
      <GeospatialHeatMap 
        data={mockParishes} 
      />
    );

    const start = performance.now();
    
    // Rerender with SAME props
    for (let i = 0; i < 100; i++) {
      rerender(
        <GeospatialHeatMap 
          data={mockParishes} 
        />
      );
    }
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(`Memoized re-render duration (100 iterations): ${duration.toFixed(2)}ms`);
    
    // With memoization, 100 re-renders with same props should be extremely fast
    // (mostly just React's diffing overhead)
    expect(duration).toBeLessThan(500); // Conservative threshold
  });
});
