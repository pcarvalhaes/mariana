(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header scrolled / solid ---------- */
  var header = document.getElementById('header');
  if (header) {
    function syncHeader() {
      if (header.classList.contains('header--solid')) {
        header.classList.add('scrolled');
        return;
      }
      header.classList.toggle('scrolled', window.scrollY > 50);
    }
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobile = document.getElementById('mobile');

  function closeMobile() {
    if (!mobile) return;
    mobile.classList.remove('open');
    document.body.style.overflow = '';
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  function openMobile() {
    if (!mobile) return;
    mobile.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (burger) burger.setAttribute('aria-expanded', 'true');
  }

  function toggleMobile() {
    if (!mobile) return;
    if (mobile.classList.contains('open')) closeMobile();
    else openMobile();
  }

  if (burger && mobile) {
    if (!burger.hasAttribute('aria-controls')) {
      burger.setAttribute('aria-controls', mobile.id || 'mobile');
    }
    if (!burger.hasAttribute('aria-expanded')) {
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMobile();
    });
    mobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobile);
    });
    document.addEventListener('click', function (e) {
      if (!mobile.classList.contains('open')) return;
      if (mobile.contains(e.target) || (burger && burger.contains(e.target))) return;
      closeMobile();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobile();
    });
  }

  /* ---------- Smooth scroll (same-page anchors only) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
      try {
        history.replaceState(null, '', href);
      } catch (err) { /* ignore */ }
    });
  });

  /* ---------- Reveal (no why-us) ---------- */
  var revealGroups = [
    ['.hero-text > *', 90],
    ['.help-head > *', 60],
    ['.help-row', 0],
    ['.classes .pill, .classes h2, .classes .lead', 70],
    ['.feat-card', 110],
    ['.prog-head > *', 80],
    ['.stack', 0],
    ['.why-card', 0],
    ['.how-head > *', 80],
    ['.testi-head > *', 80],
    ['.team-grid > *', 0],
    ['.faq-intro > *', 80],
    ['.faq-item', 40],
    ['.form-copy > *', 80],
    ['.form-panel', 0],
    ['.final h2, .final p, .final .btn', 90],
    ['.page-hero .wrap > *', 80],
    ['.path-block', 60],
    ['.testi-grid .testi-card', 50]
  ];

  var revealEls = [];
  revealGroups.forEach(function (group) {
    var sel = group[0];
    var step = group[1];
    document.querySelectorAll(sel).forEach(function (el, i) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        el.style.setProperty('--reveal-delay', Math.min(i * step, 320) + 'ms');
        revealEls.push(el);
      }
    });
  });

  if (document.body) document.body.classList.add('reveal-ready');

  if ('IntersectionObserver' in window && !reduceMotion && revealEls.length) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (btn, index) {
    var item = btn.parentElement;
    if (!item) return;
    var answer = item.querySelector('.faq-a');
    var answerId = answer && (answer.id || ('faq-a-' + index));
    if (answer && !answer.id) answer.id = answerId;
    if (answerId) btn.setAttribute('aria-controls', answerId);
    btn.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');

    btn.addEventListener('click', function () {
      if (answer && answer.hasAttribute('hidden')) return;
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (x) {
        x.classList.remove('open');
        var q = x.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Help panels ---------- */
  var helpPanels = Array.prototype.slice.call(document.querySelectorAll('.help-panel'));
  var helpRow = document.querySelector('.help-row');
  if (helpPanels.length) {
    var setHelpPanel = function (index) {
      helpPanels.forEach(function (panel, i) {
        panel.classList.toggle('is-active', i === index);
      });
    };
    helpPanels.forEach(function (panel, i) {
      var activate = function () {
        if (window.innerWidth > 1024) setHelpPanel(i);
      };
      panel.addEventListener('mouseenter', activate);
      panel.addEventListener('focus', activate);
      panel.addEventListener('click', activate);
    });
    if (helpRow) {
      helpRow.addEventListener('mouseleave', function () {
        if (window.innerWidth > 1024) setHelpPanel(0);
      });
    }
  }

  /* ---------- Why items ---------- */
  var whyItems = Array.prototype.slice.call(document.querySelectorAll('.why-item'));
  var whyBgs = Array.prototype.slice.call(document.querySelectorAll('.why-bg'));
  if (whyItems.length) {
    whyItems.forEach(function (item, i) {
      var activate = function () {
        whyItems.forEach(function (x, k) { x.classList.toggle('is-active', k === i); });
        whyBgs.forEach(function (bg, k) { bg.classList.toggle('on', k === i); });
      };
      item.addEventListener('mouseenter', activate);
      item.addEventListener('focus', activate);
      item.addEventListener('click', activate);
    });
  }

  /* ---------- How cards stack + static how-canvas ---------- */
  var howCards = Array.prototype.slice.call(document.querySelectorAll('.how-card'));
  var howStack = document.querySelector('.how-cards');
  var howCanvases = Array.prototype.slice.call(document.querySelectorAll('.how-canvas'));
  var howQueued = false;

  function sizeHowCanvas(canvas) {
    if (!canvas || !canvas.parentElement) return;
    var card = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(card.offsetWidth * dpr));
    canvas.height = Math.max(1, Math.round(card.offsetHeight * dpr));
  }

  function drawCover(canvas, img) {
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    if (!canvas.width) sizeHowCanvas(canvas);
    var cw = canvas.width;
    var ch = canvas.height;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var dw = img.naturalWidth * ratio;
    var dh = img.naturalHeight * ratio;
    var dx = (cw - dw) / 2;
    var dy = (ch - dh) * 0.45;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  var howStatic = howCanvases.map(function (canvas) {
    var src = canvas.getAttribute('data-img');
    if (!src) return null;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { drawCover(canvas, img); };
    img.src = src;
    return img;
  });

  function sizeHowCanvases() {
    howCanvases.forEach(function (canvas, i) {
      sizeHowCanvas(canvas);
      if (howStatic[i]) drawCover(canvas, howStatic[i]);
    });
  }

  function updateHow() {
    howQueued = false;
    if (!howStack || !howCards.length || reduceMotion) return;
    var top = parseFloat(getComputedStyle(howCards[0]).top) || 80;
    var rect = howStack.getBoundingClientRect();
    var start = window.scrollY + rect.top - top;
    var travel = Math.max(howStack.offsetHeight - window.innerHeight + top + 60, 1);
    var p = Math.min(Math.max((window.scrollY - start) / travel, 0), 1);
    var scale = 1 - 0.27 * p;
    howCards.forEach(function (card, i) {
      var angle = (i % 2 ? -1 : 1) * (3.2 * p);
      card.style.transform = 'scale(' + scale.toFixed(4) + ') rotate(' + angle.toFixed(3) + 'deg)';
    });
  }

  function queueHow() {
    if (!howQueued) {
      howQueued = true;
      requestAnimationFrame(updateHow);
    }
  }

  if (howCanvases.length || howCards.length) {
    window.addEventListener('scroll', queueHow, { passive: true });
    window.addEventListener('resize', function () {
      sizeHowCanvases();
      queueHow();
    });
    sizeHowCanvases();
    queueHow();
  }
})();
