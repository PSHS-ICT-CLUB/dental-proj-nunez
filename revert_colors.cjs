const fs = require('fs');
const filepath = 'c:/Users/Adrian/projects/dental-proj-nunez/src/routes/+page.svelte';
let content = fs.readFileSync(filepath, 'utf8');

// The color legend is already fixed, we just want to fix the tr class
// we can do a global replace of the emerald/rose/violet pastels inside the class string
// since they don't appear anywhere else in the file

content = content.replace(/'bg-emerald-50'/g, "'bg-green-200'");
content = content.replace(/'bg-rose-50'/g, "'bg-red-300'");
content = content.replace(/'bg-violet-50'/g, "'bg-violet-300'");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Colors reverted to original successfully.');
