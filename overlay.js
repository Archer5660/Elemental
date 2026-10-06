let isAtom = false;
let selectedElement = { atomicNumber: 1, color: '#a0e6ff' };
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let atomAnimationId = null;

window.overlayAPI.onMouseMove((x, y) => {
  mouseX = x;
  mouseY = y;
});

window.overlayAPI.onAtomToggle((active, element) => {
  isAtom = Boolean(active);
  if (element) selectedElement = element;
  renderAtom();
});

function electronShells(atomicNumber) {
  const capacities = [2, 8, 18, 32, 32, 18, 8];
  const shells = [];
  let remaining = Math.max(1, Number(atomicNumber) || 1);
  for (const capacity of capacities) {
    const count = Math.min(remaining, capacity);
    shells.push(count);
    remaining -= count;
    if (remaining <= 0) break;
  }
  return shells;
}

function renderAtom() {
  if (atomAnimationId) cancelAnimationFrame(atomAnimationId);
  atomAnimationId = null;
  document.getElementById('atom-mod-container')?.remove();
  if (!isAtom) return;

  const container = document.createElement('div');
  container.id = 'atom-mod-container';
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;';

  const nucleus = document.createElement('div');
  nucleus.style.cssText = `position:absolute;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff 0%,${selectedElement.color} 72%);box-shadow:0 0 14px 4px ${selectedElement.color};`;
  container.appendChild(nucleus);

  const electrons = [];
  const shells = electronShells(selectedElement.atomicNumber);
  const speedMultiplier = Math.max(0.25, 1 - (selectedElement.atomicNumber * 0.005));
  shells.forEach((count, shellIndex) => {
    const radius = 28 + shellIndex * 24;
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${radius * 2}px;height:${radius * 2}px;border:1px solid ${selectedElement.color};opacity:.62;border-radius:50%;box-sizing:border-box;`;
    container.appendChild(ring);
    for (let index = 0; index < count; index += 1) {
      const electron = document.createElement('div');
      electron.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 6px 2px rgba(255,255,255,.92);';
      container.appendChild(electron);
      electrons.push({ electron, ring, radius, angle: (Math.PI * 2 * index) / count, speed: (0.018 + shellIndex * 0.003) * speedMultiplier * (shellIndex % 2 ? -1 : 1) });
    }
  });

  document.body.appendChild(container);
  let atomX = mouseX;
  let atomY = mouseY;
  const animate = () => {
    if (!document.body.contains(container)) return;
    const followFactor = Math.max(0.018, 0.24 / Math.sqrt(Math.max(1, selectedElement.atomicNumber)));
    atomX += (mouseX - atomX) * followFactor;
    atomY += (mouseY - atomY) * followFactor;
    nucleus.style.transform = `translate(${atomX - 9}px,${atomY - 9}px)`;
    electrons.forEach((item) => {
      item.angle += item.speed;
      item.ring.style.transform = `translate(${atomX - item.radius}px,${atomY - item.radius}px)`;
      item.electron.style.transform = `translate(${atomX + Math.cos(item.angle) * item.radius - 3}px,${atomY + Math.sin(item.angle) * item.radius - 3}px)`;
    });
    atomAnimationId = requestAnimationFrame(animate);
  };
  animate();
}
