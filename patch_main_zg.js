const fs = require('fs');

let mainJs = fs.readFileSync('main.js', 'utf8');

const zgBlock = `  if (isZeroGravity) {
    const matterJsCode = require('fs').readFileSync(require('path').join(__dirname, 'matter.min.js'), 'utf8');
    const injectJsCode = require('fs').readFileSync(require('path').join(__dirname, 'inject-physics.js'), 'utf8');
    const finalCode = injectJsCode.replace('/* MATTER_JS_CODE */', matterJsCode);
    view.webContents.executeJavaScript(finalCode);
  } else {
    view.webContents.executeJavaScript(\`
      if (window._zeroGravityInjected) {
         window.location.reload();
      }
    \`);
  }
`;

// Insert the block inside applySettingsToView
const targetStr = `function applySettingsToView(view) {
  if (!view) return;`;

if (mainJs.includes(targetStr)) {
  mainJs = mainJs.replace(targetStr, targetStr + "\n\n" + zgBlock);
  fs.writeFileSync('main.js', mainJs);
  console.log("Patched main.js with 0 Gravity");
} else {
  console.log("Failed to find target string in main.js");
}
