      if (window._zgCleanup) window._zgCleanup();
      if (!window._zeroGravityInjected) {
        window._zeroGravityInjected = true;

        // Ensure Matter.js is loaded
        if (!window.Matter) {
          /* MATTER_JS_CODE */
        }

        (function() {
          var Engine = Matter.Engine,
              Runner = Matter.Runner,
              Bodies = Matter.Bodies,
              Composite = Matter.Composite;

          var engine = Engine.create();
          engine.gravity.y = 0;
          engine.gravity.x = 0;

          var world = engine.world;
          var wallBodies = [];
          var mouseMoveHandler;

          // Get all elements we want to float
          var els = document.querySelectorAll('p, div, img, h1, h2, h3, h4, h5, h6, a, button, input, span');
          var bodiesMap = [];

          els.forEach(function(el) {
            // Only convert leaves, and ignore tiny things or hidden things
            if (el.children.length > 0) return;
            var rect = el.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) return;

            var body = Bodies.rectangle(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              rect.width,
              rect.height,
              {
                restitution: 0.35,
                friction: 0.15,
                frictionAir: 0.14,
                density: 0.01
              }
            );

            Matter.Body.setVelocity(body, {
              x: (Math.random() - 0.5) * 0.08,
              y: (Math.random() - 0.5) * 0.08
            });
            Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.002);

            Composite.add(world, body);

            // We set width and height explicitly to avoid collapsing
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.position = 'fixed';
            el.style.margin = '0';
            el.style.top = '0';
            el.style.left = '0';
            el.style.zIndex = '2147483647'; // Max z-index
            el.style.boxSizing = 'border-box';

            bodiesMap.push({ body: body, el: el, width: rect.width, height: rect.height });
          });

          var wallOptions = { isStatic: true, restitution: 0.45, friction: 0.2 };
          function rebuildWalls() {
            if (wallBodies.length) Composite.remove(world, wallBodies);
            var w = window.innerWidth;
            var h = window.innerHeight;
            wallBodies = [
              Bodies.rectangle(w/2, -50, w, 100, wallOptions),
              Bodies.rectangle(w/2, h+50, w, 100, wallOptions),
              Bodies.rectangle(-50, h/2, 100, h, wallOptions),
              Bodies.rectangle(w+50, h/2, 100, h, wallOptions)
            ];
            Composite.add(world, wallBodies);
          }
          rebuildWalls();

          // Mouse body
          var mouseBody = Bodies.circle(-100, -100, 24, { isStatic: true, restitution: 0.45 });
          Composite.add(world, mouseBody);
          var previousMouseX = -100;
          var previousMouseY = -100;
          mouseMoveHandler = function(e) {
            var deltaX = e.clientX - previousMouseX;
            var deltaY = e.clientY - previousMouseY;
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
            Matter.Body.setPosition(mouseBody, { x: e.clientX, y: e.clientY });
            bodiesMap.forEach(function(item) {
              var dx = item.body.position.x - e.clientX;
              var dy = item.body.position.y - e.clientY;
              var distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 90) {
                var influence = (90 - distance) / 90;
                var force = 0.00055 * influence;
                Matter.Body.applyForce(item.body, item.body.position, {
                  x: deltaX * force,
                  y: deltaY * force
                });
                Matter.Body.setAngularVelocity(item.body, item.body.angularVelocity + (deltaX - deltaY) * 0.00035 * influence);
              }
            });
          };
          document.addEventListener('mousemove', mouseMoveHandler);

          var runner = Runner.create();
          runner.delta = 1000 / 60;
          Runner.run(runner, engine);
          window.addEventListener('resize', rebuildWalls);

          window._zgCleanup = function() {
            window.removeEventListener('resize', rebuildWalls);
            document.removeEventListener('mousemove', mouseMoveHandler);
            Runner.stop(runner);
            if (window._zgAnimFrame) cancelAnimationFrame(window._zgAnimFrame);
            if (window._zeroGravityInjected) window._zeroGravityInjected = false;
            window._zgCleanup = null;
          };

          window._zgUpdate = function() {
            bodiesMap.forEach(function(item) {
              item.el.style.transform = 'translate(' +
                (item.body.position.x - item.width/2) + 'px, ' +
                (item.body.position.y - item.height/2) + 'px) ' +
                'rotate(' + item.body.angle + 'rad)';
            });
            window._zgAnimFrame = requestAnimationFrame(window._zgUpdate);
          };
          window._zgUpdate();

        })();
      }
