(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load the separate HTML sections before initializing their interactions.
  async function loadSections() {
    var hosts = Array.from(document.querySelectorAll('[data-include]'));
    await Promise.all(hosts.map(async function (host) {
      var path = host.getAttribute('data-include');
      try {
        var response = await fetch(path);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        host.innerHTML = await response.text();
      } catch (err) {
        host.innerHTML = '<section><div class="wrap"><p class="note">Could not load ' +
          path.replace(/[&<>"]/g, '') +
          '. Open this site through a local server or GitHub Pages, not directly as a file.</p></div></section>';
        console.error('Section load failed:', path, err);
      }
    }));
    initialize();
  }

  function initialize() {
    var year = document.getElementById('yr');
    if (year) year.textContent = new Date().getFullYear();

    var clk = document.getElementById('clk');
    function tick() {
      if (clk) clk.textContent = new Date().toLocaleTimeString([], { hour12: false });
    }
    tick();
    window.setInterval(tick, 1000);

    // Text scramble effect, with reduced-motion support.
    var chars = '01<>/\\[]{}#$%&*+=?';
    function scramble(el) {
      if (!el) return;
      var original = el.getAttribute('data-orig') || el.textContent;
      el.setAttribute('data-orig', original);
      if (reduce) { el.textContent = original; return; }
      var frame = 0, total = 18;
      var timer = window.setInterval(function () {
        frame++;
        var output = '';
        for (var i = 0; i < original.length; i++) {
          output += (original[i] === ' ' || i < original.length * frame / total)
            ? original[i] : chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = output;
        if (frame >= total) { window.clearInterval(timer); el.textContent = original; }
      }, 35);
    }

    var sc = Array.from(document.querySelectorAll('[data-sc]'));
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { scramble(entry.target); observer.unobserve(entry.target); }
        });
      }, { threshold: 0.35 });
      sc.forEach(function (el) { observer.observe(el); });
    } else {
      sc.forEach(scramble);
    }

    // Project row hover status effect.
    document.querySelectorAll('[data-st]').forEach(function (el) {
      var row = el.parentNode, original = el.textContent, timer;
      row.addEventListener('mouseenter', function () {
        if (reduce) return;
        window.clearInterval(timer);
        var label = 'REVIEWING', i = 0;
        el.textContent = '';
        timer = window.setInterval(function () {
          i++;
          el.textContent = label.slice(0, i);
          if (i >= label.length) {
            window.clearInterval(timer);
            window.setTimeout(function () { el.textContent = original; }, 700);
          }
        }, 45);
      });
      row.addEventListener('mouseleave', function () {
        window.clearInterval(timer);
        el.textContent = original;
      });
    });

    // Terminal boot sequence.
    var kv = Array.from(document.querySelectorAll('.kv'));
    var pg = document.getElementById('pg');
    var ready = document.getElementById('rdy');
    var boot = document.getElementById('boot');
    function finishBoot() {
      kv.forEach(function (el) { el.classList.add('show'); });
      if (pg) pg.style.width = '72%';
      if (ready) ready.classList.add('show');
      if (boot) boot.textContent = 'PORTFOLIO LOADED';
    }
    if (reduce) finishBoot();
    else {
      kv.forEach(function (el, i) {
        window.setTimeout(function () { el.classList.add('show'); }, 450 + i * 350);
      });
      window.setTimeout(function () { if (pg) pg.style.width = '72%'; }, 1700);
      window.setTimeout(function () {
        if (ready) ready.classList.add('show');
        if (boot) boot.textContent = 'PORTFOLIO LOADED';
      }, 3000);
    }

    // Interactive skills modules. Bars indicate module number, not proficiency.
    var modules = [
      ['Cybersecurity Fundamentals', 'Foundational concepts related to information security, common threats, risk awareness, and safe security practices.'],
      ['Systems & Operating Systems', 'Learning how operating systems and computing environments are configured, managed, and maintained.'],
      ['Networking Concepts', 'Coursework and practice involving network structure, addressing, connectivity, and troubleshooting.'],
      ['Technical Problem-Solving', 'Breaking down technical issues, testing possible causes, and documenting the steps taken to resolve them.'],
      ['Documentation & Research', 'Organizing technical notes, explaining procedures, and presenting findings clearly and responsibly.']
    ];
    var tabs = document.getElementById('tabs'), vid = document.getElementById('vid');
    var title = document.getElementById('vt'), desc = document.getElementById('vd'), bars = document.getElementById('vb');
    if (tabs && title && desc && bars) {
      modules.forEach(function (mod, i) {
        var button = document.createElement('button');
        button.type = 'button'; button.className = 'tab'; button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', 'false'); button.setAttribute('aria-controls', 'view');
        button.id = 'skill-tab-' + i;
        button.innerHTML = '<em>0' + (i + 1) + '</em>' + mod[0];
        button.addEventListener('click', function () { selectModule(i); });
        tabs.appendChild(button);
        var bar = document.createElement('i'); bars.appendChild(bar);
      });
      function selectModule(index) {
        Array.from(tabs.children).forEach(function (tab, i) {
          tab.setAttribute('aria-selected', String(i === index));
          tab.setAttribute('tabindex', i === index ? '0' : '-1');
        });
        Array.from(bars.children).forEach(function (bar, i) { bar.className = i <= index ? 'on' : ''; });
        vid.textContent = 'MODULE 0' + (index + 1) + ' / 05';
        title.textContent = modules[index][0];
        title.setAttribute('data-orig', modules[index][0]);
        desc.textContent = modules[index][1];
      }
      tabs.addEventListener('keydown', function (event) {
        var current = Array.from(tabs.children).indexOf(document.activeElement);
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault(); var next = (current + 1) % modules.length;
          tabs.children[next].focus(); selectModule(next);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault(); var prev = (current - 1 + modules.length) % modules.length;
          tabs.children[prev].focus(); selectModule(prev);
        }
      });
      selectModule(0);
    }

    // Animated network background.
    var canvas = document.getElementById('net');
    if (canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d'), width = 0, height = 0, nodes = [], mouseX = -999, mouseY = -999, raf = null;
      function sizeCanvas() {
        var rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width; height = rect.height;
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.min(95, Math.max(20, Math.round(width * height / 18000)));
        nodes = [];
        for (var i = 0; i < count; i++) nodes.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28
        });
      }
      function draw() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < nodes.length; i++) {
          var a = nodes[i];
          if (!reduce) {
            a.x += a.vx; a.y += a.vy;
            if (a.x < 0 || a.x > width) a.vx *= -1;
            if (a.y < 0 || a.y > height) a.vy *= -1;
          }
          var mouseDist = Math.hypot(a.x - mouseX, a.y - mouseY);
          ctx.fillStyle = mouseDist < 140 ? '#CCD0CF' : '#4A5C6A';
          ctx.beginPath(); ctx.arc(a.x, a.y, mouseDist < 140 ? 2.2 : 1.4, 0, Math.PI * 2); ctx.fill();
          for (var j = i + 1; j < nodes.length; j++) {
            var b = nodes[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 115) {
              ctx.strokeStyle = 'rgba(155,168,171,' + (0.28 * (1 - dist / 115)) + ')';
              ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          if (mouseDist < 145) {
            ctx.strokeStyle = 'rgba(204,208,207,' + (0.35 * (1 - mouseDist / 145)) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouseX, mouseY); ctx.stroke();
          }
        }
        if (!reduce) raf = window.requestAnimationFrame(draw);
      }
      sizeCanvas(); draw();
      window.addEventListener('resize', function () { sizeCanvas(); if (reduce) draw(); });
      canvas.parentNode.addEventListener('mousemove', function (event) {
        var rect = canvas.getBoundingClientRect(); mouseX = event.clientX - rect.left; mouseY = event.clientY - rect.top;
      });
      canvas.parentNode.addEventListener('mouseleave', function () { mouseX = mouseY = -999; });
    }

    // Active sidebar link.
    var navLinks = Array.from(document.querySelectorAll('.rail nav a'));
    if ('IntersectionObserver' in window) {
      var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id || 'top';
            navLinks.forEach(function (link) { link.classList.toggle('on', link.getAttribute('href') === '#' + id); });
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      document.querySelectorAll('header.hero, main > div[data-include] > section').forEach(function (section) {
        navObserver.observe(section);
      });
    }
  }

  loadSections();
})();