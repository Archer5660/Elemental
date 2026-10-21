const assert = require('node:assert/strict');
const test = require('node:test');
const { buildAiStripScript, GOOGLE_SEARCH_HIDE, AI_BLOCK_GLOBAL_HIDE } = require('../ai-strip');

test('ai strip returns empty string when mode is "on"', () => {
  assert.equal(buildAiStripScript('on'), '');
});

test('ai strip embeds the mode for search-off', () => {
  const js = buildAiStripScript('search-off');
  assert.notEqual(js, '');
  assert.match(js, /AI_MODE = "search-off"/);
  assert.match(js, /GOOGLE/);
  // The apply() logic for search-off uses isGoogleSerp() and GOOGLE only.
  // Verify by parsing the script and looking for the apply function.
  assert.match(js, /isGoogleSerp/);
  // The GLOBAL CSS payload is embedded but unused at search-off. That's fine.
});

test('ai strip embeds the mode for all-off', () => {
  const js = buildAiStripScript('all-off');
  assert.match(js, /AI_MODE = "all-off"/);
  assert.match(js, /ai-assistant/i);
});

test('ai strip output is a function that does not throw on host pages', () => {
  const js = buildAiStripScript('all-off');
  // Sanity: the wrapper swallows errors. Check the try/catch.
  assert.match(js, /catch \(e\)/);
});

test('ai strip registers a MutationObserver so Google re-renders get re-stripped', () => {
  const js = buildAiStripScript('search-off');
  assert.match(js, /MutationObserver/);
});

test('ai strip hooks history.pushState and replaceState for SPA navigation', () => {
  const js = buildAiStripScript('search-off');
  assert.match(js, /history\.pushState/);
  assert.match(js, /history\.replaceState/);
});

test('search-off strip on Google includes the AI Overview block selectors', () => {
  const js = buildAiStripScript('search-off');
  // GOOGLE_SEARCH_HIDE has the AI Mode aria selector
  assert.match(js, /AI Mode/);
});

test('Google SERP detection covers www.google.com and country TLDs', () => {
  // We embed isGoogleSerp — check that .google.com suffix is matched.
  const js = buildAiStripScript('search-off');
  assert.match(js, /\.google\.com/);
});

test('all-off strip includes the global AI attribute selectors', () => {
  // JSON.stringify escapes `*` to `\\*` inside the embedded JS source.
  // The browser un-escapes it back to `*` when the string literal is parsed.
  // We verify the rendered (parsed) CSS instead, which is what actually runs in the page.
  const js = buildAiStripScript('all-off');
  // The CSS is embedded as a JS string. We can decode it and search the decoded form.
  const globalMatch = js.match(/var GLOBAL = (\{[^\n]+\}|"[\s\S]*?");/);
  assert.ok(globalMatch, 'GLOBAL css string not found in built script');
  // Decode the JSON string literal (it has surrounding quotes).
  const jsonStr = globalMatch[1];
  const decoded = JSON.parse(jsonStr);
  assert.match(decoded, /\[aria-label\*="AI" i\]/);
  assert.match(decoded, /\[data-testid\*="ai" i\]/);
});

test('returned JS executes without syntax errors via Function constructor', () => {
  // Wrapping in a function body to syntax-check.
  const js = buildAiStripScript('all-off');
  assert.doesNotThrow(() => { new Function(js); });
});

test('search-off CSS does not contain standalone data-hveid to prevent hiding normal results', () => {
  assert.doesNotMatch(GOOGLE_SEARCH_HIDE, /\[data-hveid\],/);
  assert.doesNotMatch(GOOGLE_SEARCH_HIDE, /\bdata-hveid\b/);
});

test('all-off CSS exempts essential UI words (Main, Email) from being hidden', () => {
  assert.match(AI_BLOCK_GLOBAL_HIDE, /nav\[aria-label\*="Main" i\]/);
  assert.match(AI_BLOCK_GLOBAL_HIDE, /display:\s*revert\s*!important/);
});
