(() => {
  const enabled = BLACK_HOLE_ENABLED;
  const stateKey = '__elementalBlackHoleState';
  const existing = window[stateKey];
  if (existing && existing.enabled === enabled) return;
  if (existing && typeof existing.restore === 'function') existing.restore(false);
  if (!enabled) return;

  /* MATTER_BLACK_HOLE */
  const { Engine, Runner, Bodies, Body, Composite } = Matter;
  const engine = Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = 0;
  const world = engine.world;
  const bodies = [];
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const saved = [];
  const hole = document.createElement('div');
  hole.id = 'elemental-black-hole';
  hole.setAttribute('aria-hidden', 'true');
  hole.style.cssText = 'position:fixed;left:50%;top:50%;width:78px;height:78px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#000 0 34%,#241133 48%,#6b2f93 62%,transparent 73%);box-shadow:0 0 24px 8px rgba(97,35,145,.8),inset 0 0 16px #000;z-index:2147483646;pointer-events:none;';
  document.body.appendChild(hole);

  document.querySelectorAll('body *').forEach((element) => {
    if (element === hole || element.closest('#elemental-black-hole') || element.children.length > 0) return;
    const rect = element.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    const computed = getComputedStyle(element);
    if (computed.position === 'fixed' && Number(computed.zIndex) > 2147480000) return;
    saved.push({ element, rect, style: { transform: element.style.transform, transition: element.style.transition, position: element.style.position, left: element.style.left, top: element.style.top, width: element.style.width, height: element.style.height, margin: element.style.margin, boxSizing: element.style.boxSizing, zIndex: element.style.zIndex, pointerEvents: element.style.pointerEvents, opacity: element.style.opacity, visibility: element.style.visibility } });
    element.style.position = 'fixed';
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
    element.style.margin = '0';
    element.style.boxSizing = 'border-box';
    element.style.zIndex = '2147483645';
    element.style.pointerEvents = 'none';
    const body = Bodies.rectangle(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width, rect.height, { restitution: 0.35, friction: 0.15, frictionAir: 0.018, density: Math.max(0.0005, Math.min(0.02, rect.width * rect.height * 0.000002)) });
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 0.8, y: (Math.random() - 0.5) * 0.8 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.025);
    bodies.push({ body, element, rect, absorbed: false });
  });
  Composite.add(world, bodies.map(item => item.body));

  const mouseBody = Bodies.circle(mouse.x, mouse.y, 34, { isStatic: true, restitution: 0.1 });
  Composite.add(world, mouseBody);
  let previousMouse = { x: mouse.x, y: mouse.y };
  const mouseHandler = (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    Body.setPosition(mouseBody, mouse);
  };
  document.addEventListener('mousemove', mouseHandler, true);

  const runner = Runner.create();
  Runner.run(runner, engine);
  let frameId = 0;
  const animate = () => {
    if (!document.body.contains(hole)) return;
    hole.style.left = `${mouse.x}px`;
    hole.style.top = `${mouse.y}px`;
    const mouseDelta = { x: mouse.x - previousMouse.x, y: mouse.y - previousMouse.y };
    previousMouse = { x: mouse.x, y: mouse.y };
    bodies.forEach((item) => {
      if (item.absorbed) return;
      const body = item.body;
      const dx = mouse.x - body.position.x;
      const dy = mouse.y - body.position.y;
      const distance = Math.max(12, Math.sqrt(dx * dx + dy * dy));
      const direction = { x: dx / distance, y: dy / distance };
      const strength = Math.min(0.0009, 0.000018 * (1 + 260 / distance));
      Body.applyForce(body, body.position, { x: direction.x * strength, y: direction.y * strength });
      if (distance < 150) Body.applyForce(body, { x: body.position.x + 10, y: body.position.y }, { x: mouseDelta.x * 0.00008, y: mouseDelta.y * 0.00008 });
      if (distance < 42) {
        item.absorbed = true;
        item.element.style.visibility = 'hidden';
        Composite.remove(world, body);
        return;
      }
      const element = item.element;
      element.style.transform = `translate(${body.position.x - item.rect.left - item.rect.width / 2}px,${body.position.y - item.rect.top - item.rect.height / 2}px) rotate(${body.angle}rad)`;
      element.style.opacity = '1';
    });
    frameId = requestAnimationFrame(animate);
  };
  animate();

  const restore = (showWhiteHole) => {
    cancelAnimationFrame(frameId);
    document.removeEventListener('mousemove', mouseHandler, true);
    Runner.stop(runner);
    bodies.forEach((item) => {
      Composite.remove(world, item.body);
      const element = item.element;
      element.style.visibility = 'visible';
      element.style.transition = 'transform 650ms cubic-bezier(.2,.8,.2,1), opacity 650ms ease';
      element.style.transform = `translate(${innerWidth / 2 - item.rect.left - item.rect.width / 2}px,${24 - item.rect.top - item.rect.height / 2}px) rotate(${(Math.random() - .5) * 0.25}rad)`;
      element.style.opacity = '1';
      setTimeout(() => {
        const style = item.style;
        element.style.transform = style.transform;
        element.style.transition = style.transition;
        element.style.position = style.position;
        element.style.left = style.left;
        element.style.top = style.top;
        element.style.width = style.width;
        element.style.height = style.height;
        element.style.margin = style.margin;
        element.style.boxSizing = style.boxSizing;
        element.style.zIndex = style.zIndex;
        element.style.pointerEvents = style.pointerEvents;
        element.style.opacity = style.opacity;
        element.style.visibility = style.visibility;
      }, 670);
    });
    if (showWhiteHole) {
      const ejector = document.createElement('div');
      ejector.style.cssText = 'position:fixed;left:50%;top:24px;width:64px;height:64px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fff 0 35%,#c9f7ff 52%,transparent 72%);box-shadow:0 0 28px 10px rgba(191,248,255,.95);z-index:2147483646;pointer-events:none;';
      document.body.appendChild(ejector);
      setTimeout(() => ejector.remove(), 1200);
    }
    hole.remove();
    window[stateKey] = null;
  };
  window[stateKey] = { enabled: true, restore };
})();
