// CSS-based AI content stripper for Elemental.
// Loaded by main.js and injected into webviews when aiMode !== 'on'.
//
// Two layers:
//   1. GOOGLE_SEARCH_HIDE  — applied on Google SERPs only. Removes AI Overview,
//      AI Mode tab, and similar AI-inserted blocks. Lets the classic 10-blue-link
//      result breathe.
//   2. AI_BLOCK_GLOBAL_HIDE — applied to every page when aiMode === 'all-off'.
//      Aggressively hides anything named "AI" via attribute/role/class hooks. Has
//      higher false-positive risk; that's the trade the user opted into.
//
// Selectors are intentionally attribute-heavy rather than class-heavy because
// Google mutates class names routinely.

const GOOGLE_SEARCH_HIDE = `
/* AI Overview / generative answer block */
[data-snf="nke7rc"],
[data-snf="xAzxjc"],
.block-blue-link,
.m7jPZ,
.e4xoPb,
div[data-asoch-targets*="ai_overview"],
div[aria-label="AI Overview"],
section[aria-label="AI Overview"],
div[data-entityname="AI Overview"],
div:has(> div > [data-attrid="ai:header"]),
div:has(> [data-attrid="ai:header"]),
div[data-attrid="ai:header"],
/* AI Mode toggle (the AI tab in the top nav) */
[aria-label="AI Mode"],
[aria-label*="AI Mode"],
div[role="tab"][aria-label*="AI Mode"],
div[role="listitem"]:has([aria-label*="AI Mode"]) {
  display: none !important;
}
`.trim();

const AI_BLOCK_GLOBAL_HIDE = `
/* Any element whose accessible name or data attribute mentions AI.
   Catches Adobe AI Assistant, Figma AI, Notion AI, Slack AI, etc. */
[aria-label*="AI" i],
[aria-label*="Copilot" i],
[aria-label*="Assistant" i][aria-label*="AI" i],
[data-testid*="ai" i],
[data-testid*="copilot" i],
[class*="ai-assistant" i],
[class*="ai-assist" i] {
  display: none !important;
}
/* Floating AI launchers that use role=button with "AI" in their name */
[role="button"][aria-label*="AI" i] {
  display: none !important;
}
/* Revert false positives for standard UI containing "ai" (Main, Email, Detail) */
nav[aria-label*="Main" i],
header[aria-label*="Main" i],
main[aria-label*="Main" i],
[aria-label*="Main navigation" i],
[aria-label*="Main content" i],
[aria-label*="Main menu" i],
[aria-label*="Email" i],
[aria-label*="Detail" i],
[data-testid*="main" i],
[data-testid*="email" i] {
  display: revert !important;
}
`.trim();

/**
 * Build the AI-stripping JavaScript to inject into a webview.
 * @param {string} aiMode  'on' | 'search-off' | 'all-off'
 * @returns {string} JS source to pass to webContents.executeJavaScript, or '' if no-op.
 */
function buildAiStripScript(aiMode) {
  if (aiMode === 'on') return '';
  const lines = [
    "(function(){",
    "  try {",
    "    var AI_MODE = " + JSON.stringify(aiMode) + ";",
    "    var STYLE_ID = '__elemental_ai_strip__';",
    "    function inject(css){",
    "      var s = document.getElementById(STYLE_ID);",
    "      if (s) { s.textContent = css; return; }",
    "      s = document.createElement('style');",
    "      s.id = STYLE_ID;",
    "      s.textContent = css;",
    "      (document.head || document.documentElement).appendChild(s);",
    "    }",
    "    var GOOGLE = " + JSON.stringify(GOOGLE_SEARCH_HIDE) + ";",
    "    var GLOBAL = " + JSON.stringify(AI_BLOCK_GLOBAL_HIDE) + ";",
    "    function host(){ return location.hostname; }",
    "    function isGoogleSerp(){",
    "      var h = host();",
    "      return h === 'www.google.com' || h === 'google.com' || h.endsWith('.google.com');",
    "    }",
    "    function apply(){",
    "      var css = (AI_MODE === 'all-off') ? (GOOGLE + '\\n' + GLOBAL) : (isGoogleSerp() ? GOOGLE : '');",
    "      if (css) inject(css);",
    "    }",
    "    apply();",
    "    var origPushState = history.pushState;",
    "    var origReplaceState = history.replaceState;",
    "    function hook(fn){",
    "      return function(){",
    "        var r = fn.apply(this, arguments);",
    "        setTimeout(apply, 0);",
    "        return r;",
    "      };",
    "    }",
    "    history.pushState = hook(origPushState);",
    "    history.replaceState = hook(origReplaceState);",
    "    window.addEventListener('popstate', apply);",
    "    // MutationObserver: re-apply when DOM changes (Google re-renders on scroll).",
    "    var mo = new MutationObserver(function(){ apply(); });",
    "    mo.observe(document.documentElement, { childList: true, subtree: true });",
    "  } catch (e) { /* swallow — never break the host page */ }",
    "})();"
  ];
  return lines.join('\n');
}

module.exports = { buildAiStripScript, GOOGLE_SEARCH_HIDE, AI_BLOCK_GLOBAL_HIDE };
