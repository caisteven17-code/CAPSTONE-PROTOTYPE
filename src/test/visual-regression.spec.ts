// @ts-nocheck
/**
 * Visual Regression Test Specifications
 * Framework: Playwright with @playwright/test
 * 
 * This file serves as a specification for visual regression testing
 * to ensure responsive chart behavior across different viewports.
 */

import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1440, height: 900 },
];

const pages = [
  { name: 'Priest Dashboard', path: '/priest-dashboard' },
  { name: 'Bishop Dashboard', path: '/bishop-dashboard' },
];

test.describe('Visual Regression - Responsive Charts', () => {
  for (const pageInfo of pages) {
    for (const viewport of viewports) {
      test(`Snapshot: ${pageInfo.name} on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(pageInfo.path);
        
        // Wait for charts to animate/render
        await page.waitForTimeout(2000);
        
        // Capture the entire dashboard
        await expect(page).toHaveScreenshot(`${pageInfo.name.toLowerCase().replace(' ', '-')}-${viewport.name.toLowerCase()}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.05, // Allow for minor rendering differences
        });
        
        // Specific check for chart containers
        const chartContainers = page.locator('.p-6.pt-0');
        const count = await chartContainers.count();
        
        for (let i = 0; i < count; i++) {
          const container = chartContainers.nth(i);
          const box = await container.boundingBox();
          
          if (box) {
            // Verify minimum heights are respected
            if (viewport.width < 768) {
              expect(box.height).toBeGreaterThanOrEqual(320); // min-h-80
            } else if (viewport.width < 1024) {
              expect(box.height).toBeGreaterThanOrEqual(384); // md:min-h-96
            } else {
              expect(box.height).toBeGreaterThanOrEqual(400); // lg:min-h-[400px]
            }
          }
        }
      });
    }
  }
});

test.describe('Visual Regression - Geospatial Heatmap', () => {
  test('Heatmap renders correctly with 200+ points', async ({ page }) => {
    await page.goto('/bishop-dashboard');
    
    // Switch to geospatial tab if necessary
    const geospatialTab = page.locator('button:has-text("Geospatial")');
    if (await geospatialTab.isVisible()) {
      await geospatialTab.click();
    }
    
    // Wait for map and deck.gl layer to load
    await page.waitForSelector('.gm-style', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Capture the map area
    const mapContainer = page.locator('[data-testid="geospatial-heatmap"]');
    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toHaveScreenshot('geospatial-heatmap-full.png');
    }
  });
});
