(function () {
  'use strict';

  var heroCanvas = document.querySelector('.hero-canvas');
  if (!heroCanvas) return;

  var hero = document.querySelector('.hero');
  var ctx = heroCanvas.getContext('2d');
  if (!ctx) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var isNarrow = window.matchMedia('(max-width: 767px)').matches;
  var staticOnly = reduceMotion || saveData || isNarrow;

  var totalFrames = 52;
  var frameRate = 12;
  var lastFrameIndex = totalFrames - 1;
  var frames = new Array(totalFrames);
  var frame = 0;
  var raf = null;
  var last = 0;
  var onScreen = true;

  function frameSrc(i) {
    return 'images/hero_' + String(i).padStart(3, '0') + '.webp';
  }

  function loadFrame(i, onLoad) {
    if (frames[i]) {
      if (onLoad && frames[i].complete) onLoad(frames[i]);
      else if (onLoad) frames[i].addEventListener('load', function () { onLoad(frames[i]); });
      return frames[i];
    }
    var img = new Image();
    img.decoding = 'async';
    img.src = frameSrc(i);
    frames[i] = img;
    if (onLoad) {
      img.addEventListener('load', function () { onLoad(img); });
      if (img.complete && img.naturalWidth) onLoad(img);
    }
    return img;
  }

  function draw() {
    var img = frames[frame];
    if (!img || !img.complete || !img.naturalWidth) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(heroCanvas.clientWidth * dpr);
    var h = Math.round(heroCanvas.clientHeight * dpr);
    if (heroCanvas.width !== w || heroCanvas.height !== h) {
      heroCanvas.width = w;
      heroCanvas.height = h;
    }
    var cw = heroCanvas.width;
    var ch = heroCanvas.height;
    var ratio = img.naturalWidth / img.naturalHeight;
    var cr = cw / ch;
    var dw;
    var dh;
    if (ratio > cr) {
      dh = ch;
      dw = dh * ratio;
    } else {
      dw = cw;
      dh = dw / ratio;
    }
    ctx.clearRect(0, 0, cw, ch);
    var fx = cr < 1 ? 0.78 : 0.5;
    ctx.drawImage(img, (cw - dw) * fx, (ch - dh) * 0.5, dw, dh);
  }

  function loop(t) {
    if (!last) last = t;
    if (t - last >= 1000 / frameRate) {
      last = t;
      if (frame < lastFrameIndex) {
        frame++;
        draw();
      }
      if (frame >= lastFrameIndex) {
        raf = null;
        return;
      }
    }
    raf = requestAnimationFrame(loop);
  }

  function play() {
    if (staticOnly || !onScreen || document.hidden || raf) return;
    if (frame >= lastFrameIndex) {
      draw();
      return;
    }
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  function pause() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  function showLastStatic() {
    frame = lastFrameIndex;
    draw();
  }

  // Static mode: only last frame
  if (staticOnly) {
    loadFrame(lastFrameIndex, showLastStatic);
    window.addEventListener('resize', showLastStatic);
    return;
  }

  // Animated: load frame 0 and 51 first, then remaining in background
  loadFrame(0, function () {
    if (frame === 0) draw();
  });
  loadFrame(lastFrameIndex, function () {
    if (frame === lastFrameIndex) draw();
  });

  var next = 1;
  function loadRemaining() {
    var batch = 0;
    while (next < lastFrameIndex && batch < 4) {
      (function (i) {
        loadFrame(i, function () {
          if (i === frame) draw();
        });
      })(next);
      next++;
      batch++;
    }
    if (next < lastFrameIndex) {
      setTimeout(loadRemaining, 0);
    }
  }
  setTimeout(loadRemaining, 0);

  window.addEventListener('resize', draw);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause();
    else play();
  });

  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (entries) {
      onScreen = !!(entries[0] && entries[0].isIntersecting);
      if (onScreen) play();
      else pause();
    }, { threshold: 0 }).observe(hero);
  }

  play();
})();
