const fs = require('fs');
const content = fs.readFileSync('C:/Users/baghe/.openclaw/workspace/etsyseolab-6/contexts/AppContext.tsx', 'utf8');
const lines = content.split('\n');
let inside = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const fetchEtsyProducts = useCallback')) {
        inside = true;
    }
    if (inside) {
        console.log(lines[i]);
        if (lines[i].startsWith('    }, [')) {
            break;
        }
    }
}
