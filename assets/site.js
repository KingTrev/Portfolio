/* Portfolio renderer: reads the content files edited in /admin and builds the page. */
(function () {
  'use strict';

  var CONTENT = ['/content/settings.json', '/content/projects.json', '/content/photography.json'];
  var THREE_LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/meshopt_decoder.js'
  ];

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function arr(a) { return Array.isArray(a) ? a : []; }
  function on(v) { return v !== false; }
  function accentHeading(tag, cls, text, accent) {
    return '<' + tag + ' class="' + cls + '">' + esc(text) + (accent ? ' <em>' + esc(accent) + '</em>' : '') + '</' + tag + '>';
  }
  function shot(src, alt, cap, cls) {
    if (!src) return '';
    return '<img class="' + (cls || 'shot') + '" src="' + esc(src) + '" alt="' + esc(alt || cap || '') + '" data-cap="' + esc(cap || '') + '" loading="lazy">';
  }

  // ---------- sections ----------
  function nav(s, hasPhotos) {
    return '<header class="nav"><div class="wrap">' +
      '<a class="logo" href="#top">' + esc(s.hero.name) + '</a>' +
      '<nav aria-label="Sections">' +
      (on(s.about.visible) ? '<a class="opt" href="#story">About</a>' : '') +
      (on(s.process.visible) ? '<a class="opt" href="#process">Process</a>' : '') +
      '<a href="#work">Work</a>' +
      (hasPhotos ? '<a class="opt" href="#photography">Photos</a>' : '') +
      (on(s.skills.visible) ? '<a class="opt" href="#skills">Skills</a>' : '') +
      '<a class="btn solid" href="#contact">Contact</a></nav></div></header>';
  }

  function hero(s) {
    var h = s.hero, c = s.contact;
    return '<section class="hero" id="top">' +
      (h.image ? '<img id="hero-img" src="' + esc(h.image) + '" alt="' + esc(h.image_alt) + '">' : '') +
      '<div class="copy"><div class="wrap">' +
      (arr(h.badges).length ? '<div class="badges">' + arr(h.badges).map(function (b) { return '<span class="badge">' + esc(b) + '</span>'; }).join('') + '</div>' : '') +
      '<h1>' + esc(h.name) + '</h1>' +
      (h.role ? '<p class="role">' + esc(h.role) + '</p>' : '') +
      (h.intro ? '<p>' + esc(h.intro) + '</p>' : '') +
      '<div class="cta"><a class="btn solid" href="#work">' + esc(h.primary_button || 'See the work') + '</a>' +
      (h.show_resume_button && c.resume ? '<a class="btn" href="' + esc(c.resume) + '" target="_blank" rel="noopener">View résumé</a>' : '') +
      '</div></div></div></section>';
  }

  function about(s) {
    var a = s.about;
    if (!on(a.visible)) return '';
    var tl = arr(a.timeline).map(function (t) {
      return '<li' + (t.current ? ' class="now"' : '') + '><span class="when">' + esc(t.when) + '</span><h3>' + esc(t.title) + '</h3>' +
        (t.where ? '<p class="where">' + esc(t.where) + '</p>' : '') + (t.text ? '<p class="what">' + esc(t.text) + '</p>' : '') + '</li>';
    }).join('');
    return '<section class="sec" id="story"><div class="wrap">' +
      '<div class="sec-label"><span class="meta">' + esc(a.label) + '</span></div>' +
      '<div class="story-grid"><div>' + accentHeading('h2', 'big', a.heading, a.heading_accent) +
      (a.lede ? '<p class="lede">' + esc(a.lede) + '</p>' : '') +
      arr(a.paragraphs).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '</div>' + (tl ? '<ol class="timeline" aria-label="Career path">' + tl + '</ol>' : '<div></div>') + '</div></div></section>';
  }

  function processSec(s) {
    var p = s.process;
    if (!on(p.visible)) return '';
    var steps = arr(p.steps).map(function (st) {
      return '<li><span class="k">' + esc(st.label) + '</span><h3>' + esc(st.title) + '</h3><p>' + esc(st.text) + '</p>' +
        (st.tools ? '<span class="tools">' + esc(st.tools) + '</span>' : '') + '</li>';
    }).join('');
    var extras = arr(p.extras).map(function (x) { return '<div><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div>'; }).join('');
    return '<section class="sec" id="process"><div class="wrap">' +
      '<div class="sec-label"><span class="meta">' + esc(p.label) + '</span></div>' +
      accentHeading('h2', 'big', p.heading, p.heading_accent) +
      (steps ? '<ol class="flow">' + steps + '</ol>' : '') +
      (extras ? '<div class="extras">' + extras + '</div>' : '') + '</div></section>';
  }

  var viewerQueue = [];
  function project(pr, n) {
    var id = (pr.slug || ('project-' + n)).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    var num = (n < 10 ? '0' : '') + n;
    var html = '<article class="chapter" id="' + esc(id) + '">' +
      '<div class="wrap ch-head"><div><span class="meta">' + num + ' · ' + esc([pr.category, pr.tools].filter(Boolean).join(' · ')) + '</span>' +
      '<h3>' + esc(pr.title) + '</h3></div>' +
      (pr.shows ? '<span class="proves"><b>Shows:</b> ' + esc(pr.shows) + '</span>' : '') + '</div>';

    var models = arr(pr.models).filter(function (m) { return m && m.file; });
    if (models.length) {
      var vid = 'viewer-' + id;
      viewerQueue.push({ id: vid, models: models });
      html += '<div class="viewer" id="' + vid + '"><canvas tabindex="0" aria-label="Interactive 3D model. Drag to orbit, scroll or pinch to zoom."></canvas>' +
        '<div class="v-state"><div><span class="meta v-msg">Interactive 3D model</span><div class="v-bar"><i></i></div></div></div>' +
        '<div class="v-ui"><div class="v-tabs" role="group" aria-label="Choose a model">' +
        models.map(function (m, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(m.label || ('Model ' + (i + 1))) + '</button>'; }).join('') +
        '</div><span class="meta v-hint">Drag to orbit · scroll or pinch to zoom</span>' +
        '<div class="v-tools"><button type="button" class="v-spin">Pause spin</button><button type="button" class="v-reset">Reset view</button></div></div></div>';
    } else if (pr.hero_image) {
      html += shot(pr.hero_image, pr.hero_alt, pr.title, 'bleed');
    }

    html += '<div class="wrap">';
    var gal = arr(pr.gallery).filter(function (g) { return g && g.image; });
    if (gal.length) {
      html += '<div class="grid ' + (gal.length % 3 === 0 ? 'g3' : 'g2') + '">' + gal.map(function (g) { return shot(g.image, g.alt, g.caption); }).join('') + '</div>';
    }
    var cmp = arr(pr.comparisons).filter(function (c) { return c && c.photo && c.render; });
    if (cmp.length) {
      html += '<div class="match"><h3>Photo vs. render</h3><p>The real photograph on the left, my render on the right.</p>' +
        cmp.map(function (c) {
          return '<div class="pair"><figure>' + shot(c.photo, 'Reference photograph: ' + (c.caption || ''), 'Reference photograph · ' + (c.caption || '')) +
            '<span class="tag">Photo</span></figure><figure>' + shot(c.render, 'Render: ' + (c.caption || ''), 'My render · ' + (c.caption || '')) +
            '<span class="tag r">Render</span></figure></div>';
        }).join('') + '</div>';
    }
    var facts = arr(pr.facts).filter(function (f) { return f && (f.label || f.value); });
    if (facts.length || pr.description) {
      html += '<div class="notes' + (facts.length && pr.description ? '' : ' solo') + '">' +
        (facts.length ? '<dl class="facts">' + facts.map(function (f) { return '<div><dt class="meta">' + esc(f.label) + '</dt><dd>' + esc(f.value) + '</dd></div>'; }).join('') + '</dl>' : '') +
        (pr.description ? '<p>' + esc(pr.description) + '</p>' : '') + '</div>';
    }
    return html + '</div></article>';
  }

  function work(s, projects) {
    var w = s.work, n = 0;
    var list = arr(projects).filter(function (p) { return p && on(p.visible); });
    return '<section class="sec" id="work"><div class="wrap">' +
      '<div class="sec-label"><span class="meta">' + esc(w.label) + '</span></div>' +
      '<div class="work-intro">' + accentHeading('h2', 'big', w.heading, w.heading_accent) +
      (w.intro ? '<p>' + esc(w.intro) + '</p>' : '') + '</div></div>' +
      list.map(function (p) { n += 1; return project(p, n); }).join('') + '</section>';
  }

  function photography(ph) {
    var photos = arr(ph.photos).filter(function (p) { return p && p.image; });
    if (!on(ph.visible) || !photos.length) return '';
    return '<section class="sec" id="photography"><div class="wrap">' +
      '<div class="sec-label"><span class="meta">' + esc(ph.label) + '</span></div>' +
      '<div class="work-intro">' + accentHeading('h2', 'big', ph.heading, ph.heading_accent) +
      '<div class="strip-ctrls" style="margin-bottom:28px"><button type="button" id="s-prev" aria-label="Scroll photos left">←</button><button type="button" id="s-next" aria-label="Scroll photos right">→</button></div></div></div>' +
      '<div class="strip" id="strip">' + photos.map(function (p) {
        return '<figure>' + shot(p.image, p.alt, p.caption) + (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') + '</figure>';
      }).join('') + '</div></section>';
  }

  function skills(s) {
    var k = s.skills;
    if (!on(k.visible)) return '';
    return '<section class="sec" id="skills"><div class="wrap">' +
      '<div class="sec-label"><span class="meta">' + esc(k.label) + '</span></div><div class="skills">' +
      arr(k.groups).map(function (g) {
        return '<div><h3>' + esc(g.title) + '</h3><ul>' + arr(g.items).map(function (i) {
          return '<li><span>' + esc(i.name) + '</span><span>' + esc(i.detail) + '</span></li>';
        }).join('') + '</ul></div>';
      }).join('') + '</div></div></section>';
  }

  function contact(s) {
    var c = s.contact, year = new Date().getFullYear();
    return '<section class="contact" id="contact"><div class="wrap">' +
      '<span class="meta">' + esc(c.label || 'Contact') + '</span>' +
      '<h2>' + esc(c.heading) + (c.heading_accent ? ' <span>' + esc(c.heading_accent) + '</span>' : '') + '</h2>' +
      '<div class="reach">' +
      (c.email ? '<span class="addr" id="email">' + esc(c.email) + '</span><button class="btn solid" id="copy-email" type="button">Copy email</button>' +
        '<a class="btn" href="mailto:' + esc(c.email) + '">Email me</a>' : '') +
      (c.resume ? '<a class="btn" href="' + esc(c.resume) + '" target="_blank" rel="noopener">View résumé</a>' : '') +
      (c.linkedin ? '<a class="btn" href="' + esc(c.linkedin) + '" target="_blank" rel="noopener">LinkedIn ↗</a>' : '') +
      '</div><div class="foot"><span class="meta">© ' + year + ' ' + esc(s.hero.name) + '</span>' +
      '<span class="meta">' + esc([c.phone, c.location].filter(Boolean).join(' · ')) + '</span>' +
      (c.footer_note ? '<span class="meta">' + esc(c.footer_note) + '</span>' : '') + '</div></div></section>';
  }

  // ---------- behaviour ----------
  function lightbox() {
    var shots = [].slice.call(document.querySelectorAll('.shot,.bleed'));
    var lb = document.getElementById('lb'), li = document.getElementById('lb-img'), lc = document.getElementById('lb-cap'), idx = 0;
    if (!lb || !shots.length) return;
    function show(i) { idx = (i + shots.length) % shots.length; var s = shots[idx]; li.src = s.src; li.alt = s.alt; lc.textContent = s.dataset.cap || ''; }
    shots.forEach(function (s, i) {
      s.tabIndex = 0;
      s.addEventListener('click', function () { show(i); try { lb.showModal(); } catch (e) { lb.setAttribute('open', ''); } });
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.click(); } });
    });
    document.getElementById('lb-prev').onclick = function () { show(idx - 1); };
    document.getElementById('lb-next').onclick = function () { show(idx + 1); };
    document.getElementById('lb-close').onclick = function () { lb.close(); };
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  }

  function extras() {
    var hero = document.getElementById('hero-img');
    if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { hero.style.transform = 'translateY(' + (Math.min(window.scrollY, 900) * 0.18) + 'px)'; ticking = false; });
      }, { passive: true });
    }
    var strip = document.getElementById('strip');
    if (strip) {
      var step = function (d) { strip.scrollBy({ left: d * Math.max(280, strip.clientWidth * 0.7), behavior: 'smooth' }); };
      document.getElementById('s-prev').onclick = function () { step(-1); };
      document.getElementById('s-next').onclick = function () { step(1); };
    }
    var btn = document.getElementById('copy-email'), addr = document.getElementById('email');
    if (btn && addr) {
      btn.addEventListener('click', function () {
        function sel() { var r = document.createRange(); r.selectNodeContents(addr); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected'; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr.textContent).then(function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy email'; }, 1600); }, sel);
        } else sel();
      });
    }
  }

  function loadScripts(urls) {
    return urls.reduce(function (p, url) {
      return p.then(function () {
        return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      });
    }, Promise.resolve());
  }

  function viewer(cfg) {
    var box = document.getElementById(cfg.id); if (!box) return;
    var cv = box.querySelector('canvas'), state = box.querySelector('.v-state'), msg = box.querySelector('.v-msg'), prog = box.querySelector('.v-bar i');
    function fail(t) { state.hidden = false; msg.textContent = t; prog.parentNode.hidden = true; }
    if (!window.THREE || !THREE.GLTFLoader || !THREE.OrbitControls) { fail('The 3D viewer could not load in this browser.'); return; }
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, logarithmicDepthBuffer: true }); } catch (e) { fail('3D needs WebGL, which this device does not support.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1.6, 0.05, 2000);
    var controls = new THREE.OrbitControls(cam, cv);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotate = true; controls.autoRotateSpeed = 0.6; controls.screenSpacePanning = true;
    scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x2a2620, 0.9));
    var sun = new THREE.DirectionalLight(0xfff1dc, 1.6); sun.position.set(1, 1.4, 0.8); scene.add(sun);
    var rim = new THREE.DirectionalLight(0x9fb4c8, 0.5); rim.position.set(-1, 0.6, -1); scene.add(rim);
    var loader = new THREE.GLTFLoader(); if (window.MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
    var cache = {}, current = null, home = null, active = 0;
    var tabs = [].slice.call(box.querySelectorAll('.v-tabs button')), spin = box.querySelector('.v-spin');

    function frame(obj) {
      var b = new THREE.Box3().setFromObject(obj), size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
      obj.position.sub(c);
      var r = size.length() / 2, d = r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * 0.95;
      cam.near = Math.max(r / 500, 0.01); cam.far = r * 40; cam.updateProjectionMatrix();
      home = { pos: new THREE.Vector3(d * 0.62, d * 0.34, d * 0.72), target: new THREE.Vector3(0, -size.y * 0.04, 0) };
      controls.minDistance = r * 0.25; controls.maxDistance = d * 2.5; reset();
    }
    function reset() { if (!home) return; cam.position.copy(home.pos); controls.target.copy(home.target); controls.update(); }
    function show(i) {
      active = i; tabs.forEach(function (t, k) { t.setAttribute('aria-pressed', k === i); });
      if (current) { scene.remove(current); current = null; }
      if (cache[i]) { current = cache[i]; scene.add(current); frame(current); return; }
      state.hidden = false; prog.parentNode.hidden = false; msg.textContent = 'Loading 3D model'; prog.style.width = '0%';
      loader.load(cfg.models[i].file, function (g) {
        var o = g.scene;
        o.traverse(function (n) { if (n.isMesh) [].concat(n.material).forEach(function (m) { m.side = THREE.DoubleSide; }); });
        cache[i] = o; if (active !== i) return;
        current = o; scene.add(o); frame(o); state.hidden = true;
      }, function (e) { if (e.total) prog.style.width = Math.round(e.loaded / e.total * 100) + '%'; },
      function () { fail('The model could not be loaded. Try refreshing the page.'); });
    }
    tabs.forEach(function (t, k) { t.onclick = function () { show(k); }; });
    box.querySelector('.v-reset').onclick = reset;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { controls.autoRotate = false; spin.textContent = 'Spin'; }
    spin.onclick = function () { controls.autoRotate = !controls.autoRotate; spin.textContent = controls.autoRotate ? 'Pause spin' : 'Spin'; };
    controls.addEventListener('start', function () { if (controls.autoRotate) { controls.autoRotate = false; spin.textContent = 'Spin'; } });
    function resize() { var w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(box); else window.addEventListener('resize', resize);
    resize();
    var visible = false, running = false, started = false;
    function loop() { if (!visible || document.hidden) { running = false; return; } controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop); }
    function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) kick(); });
    function start() { if (!started) { started = true; show(0); } }
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { start(); kick(); } }, { rootMargin: '300px 0px' }).observe(box);
    } else { visible = true; start(); kick(); }
  }

  function initViewers() {
    if (!viewerQueue.length) return;
    loadScripts(THREE_LIBS).then(function () { viewerQueue.forEach(viewer); }, function () {
      viewerQueue.forEach(function (v) { var b = document.getElementById(v.id); if (b) { b.querySelector('.v-msg').textContent = 'The 3D viewer could not load.'; } });
    });
  }

  // ---------- boot ----------
  function render(settings, projects, photos) {
    var s = settings || {};
    ['hero', 'about', 'process', 'work', 'skills', 'contact'].forEach(function (k) { s[k] = s[k] || {}; });
    if (s.accent_color) document.documentElement.style.setProperty('--glow', s.accent_color);
    if (s.site_title) document.title = s.site_title;
    if (s.meta_description) { var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', s.meta_description); }
    photos = photos || {};
    var hasPhotos = on(photos.visible) && arr(photos.photos).length > 0;
    document.getElementById('app').innerHTML =
      nav(s, hasPhotos) + hero(s) + about(s) + processSec(s) + work(s, (projects || {}).projects) +
      photography(photos) + skills(s) + contact(s);
    lightbox(); extras(); initViewers();
  }

  Promise.all(CONTENT.map(function (u) {
    return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); });
  })).then(function (d) { render(d[0], d[1], d[2]); }).catch(function (e) {
    document.getElementById('app').innerHTML = '<div class="loading-screen">The portfolio content could not be loaded.</div>';
    if (window.console) console.error(e);
  });

  window.__renderPortfolio = render; // used by tests
})();
