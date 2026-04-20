const fs = require('fs');
const path = require('path');

// A helper to pause execution to respect Nominatim's 1 req/sec limit
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeParishes() {
  console.log('Starting geocoding process...');
  
  // Read the BishopDashboard.tsx file to extract the ALL_PARISHES array
  const dashboardPath = path.join(__dirname, 'src', 'pages', 'BishopDashboard.tsx');
  
  if (!fs.existsSync(dashboardPath)) {
    console.error('Could not find src/pages/BishopDashboard.tsx');
    return;
  }

  const content = fs.readFileSync(dashboardPath, 'utf-8');
  
  // Extract ALL_PARISHES array using regex
  const match = content.match(/const ALL_PARISHES = (\[[\s\S]*?\]);/);
  
  if (!match) {
    console.error('Could not find ALL_PARISHES array in BishopDashboard.tsx');
    return;
  }

  let parishes = [];
  try {
    // Safely evaluate the array string to a JS object
    // We use Function instead of eval for slightly better safety, though it's a local script
    parishes = new Function(`return ${match[1]}`)();
  } catch (e) {
    console.error('Error parsing ALL_PARISHES array:', e);
    return;
  }

  console.log(`Found ${parishes.length} parishes. Starting geocoding...`);
  
  const geocodedParishes = [];
  
  for (let i = 0; i < parishes.length; i++) {
    const parish = parishes[i];
    // Add "Laguna, Philippines" to improve search accuracy
    const searchQuery = `${parish.name}, Laguna, Philippines`;
    
    console.log(`[${i + 1}/${parishes.length}] Geocoding: ${searchQuery}`);
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'User-Agent': 'Ecclesia-Church-Management-System/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        parish.lat = parseFloat(data[0].lat);
        parish.lng = parseFloat(data[0].lon);
        console.log(`  -> Found: ${parish.lat}, ${parish.lng}`);
      } else {
        console.log(`  -> Not found. Falling back to Laguna center.`);
        // Fallback to Laguna province center if not found
        parish.lat = 14.1686;
        parish.lng = 121.3253;
      }
    } catch (error) {
      console.error(`  -> Error fetching data for ${parish.name}:`, error.message);
      parish.lat = 14.1686;
      parish.lng = 121.3253;
    }
    
    geocodedParishes.push(parish);
    
    // Respect Nominatim's usage policy (1 request per second)
    await delay(1100);
  }
  
  const outputPath = path.join(__dirname, 'src', 'data', 'parishes-geocoded.json');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(geocodedParishes, null, 2));
  console.log(`\nGeocoding complete! Saved to ${outputPath}`);
}

geocodeParishes();
