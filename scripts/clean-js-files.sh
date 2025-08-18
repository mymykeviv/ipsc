#!/bin/bash

# Clean up compiled JavaScript files that override TypeScript source
echo "🧹 Cleaning up compiled JavaScript files..."

# Find and remove all .js files in frontend/src that have corresponding .tsx or .ts files
find frontend/src -name "*.js" -type f | while read -r js_file; do
    # Get the corresponding TypeScript file
    ts_file="${js_file%.js}.tsx"
    if [ ! -f "$ts_file" ]; then
        ts_file="${js_file%.js}.ts"
    fi
    
    # If TypeScript file exists, remove the JavaScript file
    if [ -f "$ts_file" ]; then
        echo "Removing $js_file (overrides $ts_file)"
        rm "$js_file"
    fi
done

echo "✅ Cleanup complete!"
