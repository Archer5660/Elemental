const fs = require('fs');
let main = fs.readFileSync('main.js', 'utf8');

const gooseCode = fs.readFileSync('cat-goose.js', 'utf8');

const startMarker = `if (isCat) {`;
const endMarker = `} else {`;
const startIndex = main.indexOf(startMarker);
const endIndex = main.indexOf(endMarker, startIndex);

if (startIndex > -1 && endIndex > -1) {
  const newBlock = `if (isCat) {\n    const isGooseMode = isGoose;\n    view.webContents.executeJavaScript(\`\n      var GOOSE_PLACEHOLDER = \${isGooseMode};\n` +
    gooseCode.replace(/var isGoose = GOOSE_PLACEHOLDER;/, "var isGoose = GOOSE_PLACEHOLDER;") +
    `\n    \`);\n  `;
  main = main.substring(0, startIndex) + newBlock + main.substring(endIndex);
  fs.writeFileSync('main.js', main);
  console.log('Patched main.js successfully');
} else {
  console.log('Markers not found');
}
