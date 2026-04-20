import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChartContainer } from '../ChartContainer';
import React from 'react';

// Mock Recharts to avoid rendering issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

describe('ChartContainer', () => {
  it('renders with responsive height classes', () => {
    const { container } = render(
      <ChartContainer title="Test Chart">
        <div data-testid="chart-content">Chart Content</div>
      </ChartContainer>
    );

    const cardContent = container.querySelector('.min-h-80');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveClass('md:min-h-96');
    expect(cardContent).toHaveClass('lg:min-h-[400px]');
  });

  it('renders title and description', () => {
    render(
      <ChartContainer title="Test Chart" description="Test Description">
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ChartContainer title="Test Chart">
        <div data-testid="test-child">Test Child</div>
      </ChartContainer>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
});
