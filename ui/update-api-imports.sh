#!/bin/bash

# Script to update all API_URL declarations to use the centralized config

echo "Updating API imports across the codebase..."

# Find all TypeScript files that declare API_URL with the old pattern
# and replace with the new import

# Pattern 1: const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
# Pattern 2: const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

files=(
  "src/Events.tsx"
  "src/FoodItems.tsx"
  "src/Preferences.tsx"
  "src/Nutrients.tsx"
  "src/Users.tsx"
  "src/CreateFoodItem.tsx"
  "src/components/events/EditEventDialog.tsx"
  "src/components/events/CreateEventDialog.tsx"
  "src/components/events/NutritionSummary.tsx"
  "src/components/events/ShareEventDialog.tsx"
  "src/components/events/AcceptSharedEventDialog.tsx"
  "src/components/events/NutrientGoalsDialog.tsx"
  "src/components/food-items/CreateFoodItemDialog.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Check if file already has the import
    if grep -q "import { API_URL } from" "$file"; then
      echo "  ✓ Already updated, skipping"
      continue
    fi

    # Check if file has the old pattern
    if grep -q "const API_URL = import.meta.env.VITE_API_URL" "$file"; then
      # Determine the correct import path based on file location
      if [[ "$file" == src/components/* ]]; then
        import_path="../../config/api"
      elif [[ "$file" == src/components/events/* ]]; then
        import_path="../../config/api"
      elif [[ "$file" == src/components/food-items/* ]]; then
        import_path="../../config/api"
      else
        import_path="./config/api"
      fi

      # Create a temporary file
      temp_file=$(mktemp)

      # Process the file
      awk -v import_path="$import_path" '
        /^const API_URL = import.meta.env.VITE_API_URL/ {
          # Skip this line - we will add import at the top
          next
        }
        /^import/ && !imported {
          print
          # After imports, check if we need to add our import
          if (getline next_line > 0) {
            # If next line is still an import, keep going
            if (next_line ~ /^import/) {
              print next_line
            } else {
              # Add our import before the first non-import line
              print "import { API_URL } from \"" import_path "\";"
              if (next_line ~ /^$/) {
                print next_line
              } else {
                print ""
                print next_line
              }
              imported = 1
            }
          }
          next
        }
        { print }
      ' "$file" > "$temp_file"

      # Replace original file
      mv "$temp_file" "$file"
      echo "  ✓ Updated"
    else
      echo "  - No API_URL declaration found"
    fi
  else
    echo "⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ API import update complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Build the app: npm run build"
echo "3. Test locally: npm run dev"
