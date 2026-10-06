if (window._catModInjected2) {
  var cat = document.getElementById('geometry-dash-cat-mod');
  if (cat) cat.remove();
  var cs = document.getElementById('cat-mod-style');
  if (cs) cs.remove();
  window._catModInjected2 = false;
  clearInterval(window._gooseInterval);
}

window._catModInjected2 = true;
var isGoose = GOOSE_PLACEHOLDER;

var catStyle = document.createElement('style');
catStyle.id = 'cat-mod-style';

if (isGoose) {
  catStyle.textContent = [
    '@keyframes cat-front-run { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }',
    '@keyframes cat-back-run { 0%,100%{transform:rotate(30deg)} 50%{transform:rotate(-30deg)} }',
    '@keyframes cat-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }',
    '#cat-inner { position:relative;width:55px;height:55px; }',
    '#cat-inner.moving { animation: cat-bounce 0.25s infinite ease-in-out; }',
    '#cat-body-el { position:absolute;left:10px;top:25px;width:30px;height:18px;background:#fff;border-radius:15px; }',
    '#cat-head-el { position:absolute;left:-5px;top:0px;width:20px;height:20px;background:#fff;border-radius:50%; }',
    '#cat-neck-el { position:absolute;left:5px;top:10px;width:12px;height:25px;background:#fff;transform:rotate(-20deg); }',
    '#cat-beak-el { position:absolute;left:-12px;top:5px;width:15px;height:8px;background:#f39c12;border-radius:8px 0 0 8px; }',
    '.cat-eye-el { position:absolute;width:4px;height:4px;background:#000;border-radius:50%; }',
    '#cat-eye-l { left:2px;top:6px; }',
    '#cat-eye-r { left:10px;top:6px; }',
    '.cat-leg-el { position:absolute;width:4px;height:12px;background:#e67e22;border-radius:2px;transform-origin:top center; }',
    '#cat-fl.moving { animation:cat-front-run 0.22s infinite; }',
    '#cat-fr.moving { animation:cat-back-run 0.22s infinite; }',
    '#cat-fl { left:15px;top:40px; }',
    '#cat-fr { left:25px;top:40px; }',
    '.mud-footprint { position:fixed;width:12px;height:10px;background:#5c4033;border-radius:50%;opacity:0.7;pointer-events:none;z-index:2147483645; }',
    '.honk-text { position:fixed;color:#000;font-weight:bold;font-size:24px;pointer-events:none;z-index:2147483647;animation:honk-fade 2s forwards; }',
    '@keyframes honk-fade { 0%{opacity:1;transform:translateY(0);} 100%{opacity:0;transform:translateY(-50px);} }'
  ].join('\n');
} else {
  catStyle.textContent = [
    '@keyframes cat-front-run { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }',
    '@keyframes cat-back-run { 0%,100%{transform:rotate(30deg)} 50%{transform:rotate(-30deg)} }',
    '@keyframes cat-tail-wag { 0%,100%{transform:rotate(-40deg)} 50%{transform:rotate(10deg)} }',
    '@keyframes cat-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }',
    '#cat-inner { position:relative;width:55px;height:38px; }',
    '#cat-inner.moving { animation: cat-bounce 0.25s infinite ease-in-out; }',
    '#cat-body-el { position:absolute;left:10px;top:12px;width:30px;height:16px;background:#f4a460;border-radius:12px 8px 8px 12px; }',
    '#cat-head-el { position:absolute;left:0;top:4px;width:18px;height:16px;background:#f4a460;border-radius:50%; }',
    '.cat-ear-el { position:absolute;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:6px solid #e8974f; }',
    '#cat-ear-l { left:1px;top:-2px;transform:rotate(-15deg); }',
    '#cat-ear-r { left:9px;top:-2px;transform:rotate(15deg); }',
    '.cat-eye-el { position:absolute;width:3px;height:4px;background:#333;border-radius:50%; }',
    '#cat-eye-l { left:5px;top:8px; }',
    '#cat-eye-r { left:11px;top:8px; }',
    '#cat-nose-el { position:absolute;left:2px;top:12px;width:3px;height:2px;background:#ff9999;border-radius:50%; }',
    '#cat-tail-el { position:absolute;left:38px;top:14px;width:16px;height:4px;background:#e8974f;border-radius:2px;transform-origin:left center;animation:cat-tail-wag 0.4s infinite ease-in-out; }',
    '.cat-leg-el { position:absolute;width:4px;height:12px;background:#d2946b;border-radius:2px;transform-origin:top center; }',
    '#cat-fl.moving { animation:cat-front-run 0.22s infinite; }',
    '#cat-fr.moving { animation:cat-back-run 0.22s infinite; }',
    '#cat-bl.moving { animation:cat-back-run 0.22s infinite; }',
    '#cat-br.moving { animation:cat-front-run 0.22s infinite; }',
    '#cat-fl { left:12px;top:26px; }',
    '#cat-fr { left:18px;top:26px; }',
    '#cat-bl { left:30px;top:26px; }',
    '#cat-br { left:36px;top:26px; }'
  ].join('\n');
}

document.head.appendChild(catStyle);

var catOuter = document.createElement('div');
catOuter.id = 'geometry-dash-cat-mod';
catOuter.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;';

if (isGoose) {
  catOuter.innerHTML = '<div id="cat-inner">'
    + '<div id="cat-body-el"></div>'
    + '<div id="cat-neck-el"></div>'
    + '<div id="cat-head-el">'
    + '<div id="cat-beak-el"></div>'
    + '<div class="cat-eye-el" id="cat-eye-l"></div>'
    + '<div class="cat-eye-el" id="cat-eye-r"></div>'
    + '</div>'
    + '<div class="cat-leg-el" id="cat-fl"></div>'
    + '<div class="cat-leg-el" id="cat-fr"></div>'
    + '</div>';
} else {
  catOuter.innerHTML = '<div id="cat-inner">'
    + '<div id="cat-body-el"></div>'
    + '<div id="cat-head-el">'
    + '<div class="cat-ear-el" id="cat-ear-l"></div>'
    + '<div class="cat-ear-el" id="cat-ear-r"></div>'
    + '<div class="cat-eye-el" id="cat-eye-l"></div>'
    + '<div class="cat-eye-el" id="cat-eye-r"></div>'
    + '<div id="cat-nose-el"></div>'
    + '</div>'
    + '<div id="cat-tail-el"></div>'
    + '<div class="cat-leg-el" id="cat-fl"></div>'
    + '<div class="cat-leg-el" id="cat-fr"></div>'
    + '<div class="cat-leg-el" id="cat-bl"></div>'
    + '<div class="cat-leg-el" id="cat-br"></div>'
    + '</div>';
}

document.body.appendChild(catOuter);

var mouseX2 = window.innerWidth / 2, mouseY2 = window.innerHeight / 2;
var catX2 = mouseX2, catY2 = mouseY2;

document.addEventListener('mousemove', function(e) {
  mouseX2 = e.clientX;
  mouseY2 = e.clientY;
});

var catInner = catOuter.querySelector('#cat-inner');
var legs = catOuter.querySelectorAll('.cat-leg-el');

var lastMudTime = 0;

function animateCat2() {
  if (!document.getElementById('geometry-dash-cat-mod')) return;

  var dx = mouseX2 - catX2;
  var dy = mouseY2 - catY2;
  var dist = Math.sqrt(dx*dx + dy*dy);

  var isMoving = dist > 3;

  if (isMoving) {
    catX2 += dx * 0.05;
    catY2 += dy * 0.05;

    if (isGoose && Date.now() - lastMudTime > 200) {
      lastMudTime = Date.now();
      var mud = document.createElement('div');
      mud.className = 'mud-footprint';
      mud.style.left = (catX2 + (Math.random()*10 - 5)) + 'px';
      mud.style.top = (catY2 + 25 + (Math.random()*10 - 5)) + 'px';
      document.body.appendChild(mud);
      setTimeout(function() {
        mud.style.opacity = '0';
        setTimeout(function() { mud.remove(); }, 5000);
      }, 2000);
    }
  }

  // Toggle moving class for animations
  if (isMoving) {
    catInner.classList.add('moving');
    legs.forEach(function(l) { l.classList.add('moving'); });
  } else {
    catInner.classList.remove('moving');
    legs.forEach(function(l) { l.classList.remove('moving'); });
  }

  var scaleX = (mouseX2 < catX2) ? 1 : -1;
  catOuter.style.left = catX2 + 'px';
  catOuter.style.top = (catY2 + 25) + 'px';
  catOuter.style.transform = 'translate(-50%, -50%) scaleX(' + scaleX + ')';

  requestAnimationFrame(animateCat2);
}
animateCat2();

if (isGoose) {
  window._gooseInterval = setInterval(function() {
    if (Math.random() < 0.3) {
      // HONK!
      var honk = document.createElement('div');
      honk.className = 'honk-text';
      honk.innerText = 'HONK!';
      honk.style.left = catOuter.style.left;
      honk.style.top = catOuter.style.top;
      document.body.appendChild(honk);
      setTimeout(function() { honk.remove(); }, 2000);
    }
    if (Math.random() < 0.1) {
      // "Steal" cursor by pushing window around
      window.scrollBy(Math.random()*200 - 100, Math.random()*200 - 100);
    }
  }, 3000);
}
