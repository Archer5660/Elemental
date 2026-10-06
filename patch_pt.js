const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const elemsStr = fs.readFileSync('elements.json', 'utf8');

// Replace elements array
const startStr = "const elements = [";
const endStr = "];";
const sIdx = html.indexOf(startStr);
const eIdx = html.indexOf(endStr, sIdx);

if (sIdx > -1 && eIdx > -1) {
  html = html.substring(0, sIdx) + `const elements = ${elemsStr};` + html.substring(eIdx + 2);
}

// Add colors for lanthanide and actinide
html = html.replace("postTransition: '#c1ffc1'", "postTransition: '#c1ffc1',\n      lanthanide: '#ffb3e6',\n      actinide: '#c2b280'");

// Update row loop
html = html.replace(/for \(let r = 1; r <= 4; r\+\+\)/g, "for (let r = 1; r <= 10; r++)");

// We also need to add placeholders for La and Ac spots so the grid doesn't break
// Actually in grid, if cell is empty, it just leaves a gap, which is perfect!

fs.writeFileSync('index.html', html);
console.log("Patched index.html PT");
