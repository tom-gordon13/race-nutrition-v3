const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  // Page level files
  'src/Preferences.tsx',
  'src/Nutrients.tsx',
  'src/Users.tsx',
  'src/CreateFoodItem.tsx',
  // Component files
  'src/components/events/AcceptSharedEventDialog.tsx',
  'src/components/events/CreateEventDialog.tsx',
  'src/components/events/EditEventDialog.tsx',
  'src/components/events/NutrientGoalsDialog.tsx',
  'src/components/events/NutritionSummary.tsx',
  'src/components/events/ShareEventDialog.tsx',
  'src/components/food-items/CreateFoodItemDialog.tsx',
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  // Determine import path based on file location
  const importPath = filePath.startsWith('src/components/')
    ? '../../config/api'
    : './config/api';

  const apiImport = `import { API_URL } from '${importPath}';`;

  // Find the last import statement
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    console.log(`⚠️  No imports found in ${filePath}`);
    return;
  }

  // Check if API_URL import already exists
  if (content.includes(apiImport)) {
    console.log(`✓ ${filePath} - already has correct import`);
    return;
  }

  // Insert after last import
  lines.splice(lastImportIndex + 1, 0, apiImport);

  const newContent = lines.join('\n');
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`✓ Updated ${filePath}`);
});

console.log('\n✅ All files updated!');
