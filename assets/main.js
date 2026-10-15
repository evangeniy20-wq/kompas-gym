(function () {
  var d = document, w = window, C = w.KOMPAS || {};
  d.documentElement.classList.remove('no-js');
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Цели Метрики */
  function goal(name) {
    if (!name) return;
    try { if (typeof w.ym === 'function' && C.metrika) w.ym(C.metrika, 'reachGoal', name); } catch (e) {}
  }
  d.addEventListener('click', function (e) {
    var el = e.target.closest('[data-goal]');
    if (el) goal(el.getAttribute('data-goal'));
    var a = e.target.closest('a[href^="tel:"]');
    if (a && !a.hasAttribute('data-goal')) goal('phone_click');
    var pick = e.target.closest('[data-pick]');
    if (pick) {
      var sel = d.getElementById('f-what');
      if (sel) {
        var norm = function (s) { return s.replace(/[\s\u00a0\u202f\u2060]+/g, ' ').trim(); };
        var want = norm(pick.getAttribute('data-pick'));
        for (var i = 0; i < sel.options.length; i++) if (norm(sel.options[i].text) === want) { sel.selectedIndex = i; break; }
      }
    }
  });

  /* Шапка и меню */
  var hdr = d.querySelector('.hdr'), burger = d.querySelector('.burger');
  function onScroll() {
    var y = w.scrollY || 0;
    if (hdr && !hdr.classList.contains('hdr--page')) hdr.classList.toggle('is-solid', y > 40);
    var bar = d.querySelector('.mbar');
    if (bar) bar.classList.toggle('is-on', y > 480);
  }
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() {
    if (!hdr) return;
    hdr.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = !hdr.classList.contains('is-open');
      hdr.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { var f = hdr.querySelector('.mnav a'); if (f) f.focus(); }
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hdr.classList.contains('is-open')) { closeMenu(); burger.focus(); } });
    d.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* Первый экран: ролик по прокрутке (кадры WebP на canvas) */
  var hs = d.querySelector('.hero--scroll');
  if (hs) {
    var stage = hs.querySelector('.hero__stage'), cv = hs.querySelector('.hero__cv'), hin = hs.querySelector('.hero__in');
    var steps = hs.querySelectorAll('.hstep');
    var still = (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) || (navigator.connection && navigator.connection.saveData);
    if (still || !cv.getContext) { hs.classList.add('hero--static'); }
    else {
      var small = w.innerWidth < 768;
      var base = hs.getAttribute(small ? 'data-seq-s' : 'data-seq-l'), n = +hs.getAttribute(small ? 'data-n-s' : 'data-n-l');
      var ctx = cv.getContext('2d'), imgs = new Array(n), cur = -1, need = 0, ticking = false;
      var name = function (i) { return base + ('00' + i).slice(-3) + '.webp'; };
      var size = function () {
        var r = Math.min(w.devicePixelRatio || 1, small ? 2 : 1.5);
        cv.width = Math.round(stage.clientWidth * r); cv.height = Math.round(stage.clientHeight * r); cur = -1; draw();
      };
      var near = function (i) { /* ближайший загруженный кадр */
        for (var k = 0; k < n; k++) { if (imgs[i - k] && imgs[i - k].ok) return imgs[i - k]; if (imgs[i + k] && imgs[i + k].ok) return imgs[i + k]; }
        return null;
      };
      var draw = function () {
        var im = near(need); if (!im) return;
        var key = im.idx; if (key === cur) return; cur = key;
        var cw = cv.width, ch = cv.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
        var iw = im.naturalWidth * s, ih = im.naturalHeight * s;
        ctx.drawImage(im, (cw - iw) / 2, (ch - ih) / 2, iw, ih);
        if (!hs.classList.contains('is-cv')) hs.classList.add('is-cv');
      };
      var load = function (i) {
        if (imgs[i]) return; var im = new Image(); im.idx = i; im.decoding = 'async';
        im.onload = function () { im.ok = true; if (Math.abs(i - need) < 3 || cur < 0) { cur = -1; draw(); } };
        im.src = name(i); imgs[i] = im;
      };
      /* сначала каждый 8-й кадр, потом 4-й, 2-й и все остальные — прокрутка работает сразу */
      var order = [];
      [8, 4, 2, 1].forEach(function (st) { for (var i = 0; i < n; i += st) if (order.indexOf(i) < 0) order.push(i); });
      if (order.indexOf(n - 1) < 0) order.splice(1, 0, n - 1);
      var start = function () { var j = 0; (function next() { var k = 0; while (j < order.length && k < 6) { load(order[j++]); k++; } if (j < order.length) setTimeout(next, 60); })(); };
      var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); };
      var upd = function () {
        ticking = false;
        var r = hs.getBoundingClientRect(), span = hs.offsetHeight - stage.clientHeight;
        var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
        need = Math.round(p * (n - 1)); draw();
        if (hin) { var o = 1 - ease(p / 0.2); hin.style.opacity = o; hin.style.transform = 'translateY(' + (-40 * (1 - o)) + 'px)'; hin.style.visibility = o < 0.02 ? 'hidden' : ''; }
        for (var i = 0; i < steps.length; i++) { var a = 0.24 + i * 0.25; steps[i].classList.toggle('is-on', p >= a && (i === steps.length - 1 ? p <= 1.01 : p < a + 0.25)); }
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
      size(); upd();
      w.addEventListener('scroll', onScroll, { passive: true });
      var rz; w.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); upd(); }, 120); });
      if (d.readyState === 'complete') start(); else w.addEventListener('load', start);
    }
  }

  /* Появление блоков */
  var rv = d.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in w)) {
    rv.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* FAQ: цель на раскрытие */
  d.querySelectorAll('.faq details').forEach(function (dt) {
    dt.addEventListener('toggle', function () { if (dt.open) goal('faq_open'); });
  });

  /* Форма */
  d.querySelectorAll('form.js-form').forEach(function (form) {
    var box = form.closest('.form');
    var phone = form.querySelector('input[type=tel]');
    var name = form.querySelector('input[name=name]');
    function digits(s) { return (s || '').replace(/\D/g, ''); }
    function okPhone() { var n = digits(phone.value); return n.length === 11 && /^[78]/.test(n) || n.length === 10; }
    function setErr(inp, bad) { inp.closest('.fld').classList.toggle('is-err', bad); inp.setAttribute('aria-invalid', bad ? 'true' : 'false'); }
    if (phone) {
      phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 '; });
      phone.addEventListener('input', function () {
        var n = digits(phone.value); if (n[0] === '8') n = '7' + n.slice(1); if (n[0] !== '7') n = '7' + n; n = n.slice(0, 11);
        var o = '+7'; if (n.length > 1) o += ' (' + n.slice(1, 4); if (n.length >= 4) o += ') ' + n.slice(4, 7); if (n.length >= 7) o += '-' + n.slice(7, 9); if (n.length >= 9) o += '-' + n.slice(9, 11);
        phone.value = o;
        if (phone.closest('.fld').classList.contains('is-err')) setErr(phone, !okPhone());
      });
      phone.addEventListener('blur', function () { if (digits(phone.value).length > 1) setErr(phone, !okPhone()); });
    }
    if (name) name.addEventListener('blur', function () { if (name.value) setErr(name, name.value.trim().length < 2); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = false;
      if (name && name.value.trim().length < 2) { setErr(name, true); bad = true; }
      if (phone && !okPhone()) { setErr(phone, true); bad = true; }
      var agree = form.querySelector('input[name=agree]');
      if (agree) { var ag = agree.closest('.agree'); ag.classList.toggle('is-err', !agree.checked); if (!agree.checked) { bad = true; } }
      if (bad) { var f = form.querySelector('.is-err input'); if (f) f.focus(); return; }
      var what = form.querySelector('select'); var whatText = what ? what.options[what.selectedIndex].text : '';
      var noteEl = form.querySelector('[name=note]');
      var data = { name: name.value.trim(), phone: phone.value, what: whatText, note: noteEl ? noteEl.value : '', page: location.pathname };
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      function show(kind) {
        box.classList.add('is-sent'); box.setAttribute('data-sent', kind);
        var h = box.querySelector('.form__ok--' + kind + ' h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      }
      function viaWhatsApp() {
        /* Обработчика заявок нет или он не ответил: открываем WhatsApp с готовым текстом */
        var t = 'Здравствуйте! Хочу записаться в «Компас».\nИмя: ' + data.name + '\nТелефон: ' + data.phone + '\nИнтересует: ' + data.what + (data.note ? '\n' + data.note : '');
        var url = 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(t);
        var again = box.querySelector('.js-wa-again'); if (again) again.href = url;
        if (C.whatsapp) w.open(url, '_blank', 'noopener');
        goal('form_whatsapp'); show('wa');
      }
      if (C.formEndpoint) {
        fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (r.ok) { goal('form_submit'); show('ok'); } else viaWhatsApp(); })
          .catch(viaWhatsApp);
      } else { viaWhatsApp(); }
    });
    var ag2 = form.querySelector('input[name=agree]');
    if (ag2) ag2.addEventListener('change', function () { if (ag2.checked) ag2.closest('.agree').classList.remove('is-err'); });
  });

  /* Открыто сейчас: считаем по московскому времени */
  (function () {
    var H = C.hours; if (!H || !H.length) return;
    var now = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
    var dow = (now.getDay() + 6) % 7, min = now.getHours() * 60 + now.getMinutes();
    function day(i) { for (var k = 0; k < H.length; k++) if (H[k][0].indexOf(i) > -1) return H[k]; return null; }
    function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
    var t = day(dow), text, open = false;
    if (t && min >= t[1] && min < t[2]) { open = true; text = 'Открыто до\u00a0' + hm(t[2]); }
    else if (t && min < t[1]) text = 'Закрыто, откроемся в\u00a0' + hm(t[1]);
    else {
      for (var i = 1; i <= 7; i++) { var nd = day((dow + i) % 7); if (nd) { text = 'Закрыто, откроемся ' + (i === 1 ? 'завтра' : 'в\u00a0' + ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'][(dow + i) % 7]) + ' в\u00a0' + hm(nd[1]); break; } }
    }
    d.querySelectorAll('[data-open]').forEach(function (el) { el.textContent = text; el.classList.toggle('is-open', open); el.hidden = false; });
  
  })();

  /* Счётчики на первом экране */
  if (!reduce && 'IntersectionObserver' in w) {
    var cs = d.querySelectorAll('[data-count]');
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io2.unobserve(e.target);
        var el = e.target, to = +el.getAttribute('data-count'), from = +(el.getAttribute('data-from') || 0), t0 = null;
        function f(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f'); }
        function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1100); var e2 = 1 - Math.pow(1 - p, 3); el.textContent = f(from + (to - from) * e2); if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    });
    cs.forEach(function (c) { io2.observe(c); });
  }

  /* Галерея на весь экран */
  var figs = [].slice.call(d.querySelectorAll('.gallery figure'));
  if (figs.length) {
    var lb = d.createElement('dialog'); lb.className = 'lb'; lb.setAttribute('aria-label', 'Фото зала');
    lb.innerHTML = '<figure class="lb__fig"><img alt=""><figcaption></figcaption></figure><button class="lb__btn lb__prev" type="button" aria-label="Предыдущее фото">‹</button><button class="lb__btn lb__next" type="button" aria-label="Следующее фото">›</button><button class="lb__x" type="button" aria-label="Закрыть">×</button><p class="lb__n" aria-live="polite"></p>';
    d.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), num = lb.querySelector('.lb__n'), cur = 0;
    function showImg(i) {
      cur = (i + figs.length) % figs.length; var src = figs[cur].querySelector('img');
      img.src = src.currentSrc && src.currentSrc.indexOf('-640') > -1 ? src.currentSrc.replace('-640', '-1200') : (src.currentSrc || src.src);
      img.alt = src.alt; var c = figs[cur].querySelector('figcaption'); cap.textContent = c ? c.textContent : '';
      num.textContent = (cur + 1) + ' / ' + figs.length;
    }
    figs.forEach(function (f, i) {
      f.setAttribute('tabindex', '0'); f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Открыть фото: ' + (f.querySelector('img').alt || 'зал'));
      function open() { showImg(i); lb.showModal(); goal('gallery_open'); }
      f.addEventListener('click', open);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.querySelector('.lb__prev').addEventListener('click', function () { showImg(cur - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { showImg(cur + 1); });
    lb.querySelector('.lb__x').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') showImg(cur - 1); if (e.key === 'ArrowRight') showImg(cur + 1); });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) showImg(cur + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* Отзывы: точки навигации для прокрутки на телефоне */
  d.querySelectorAll('.reviews').forEach(function (r) {
    var items = r.querySelectorAll('.review'); if (items.length < 2) return;
    var dots = d.createElement('div'); dots.className = 'dots'; dots.setAttribute('aria-label', 'Листать отзывы');
    items.forEach(function (it, i) {
      var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Отзыв ' + (i + 1));
      b.addEventListener('click', function () { r.scrollTo({ left: it.offsetLeft - r.offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); });
      dots.appendChild(b);
    });
    r.after(dots);
    function upd() { var i = Math.round(r.scrollLeft / (items[0].offsetWidth + 16)); dots.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); }); }
    r.addEventListener('scroll', upd, { passive: true }); upd();
  });
  /* Отзывы: одна цитата, стрелки и клавиши */
  d.querySelectorAll('[data-quotes]').forEach(function (box) {
    var qs = box.querySelectorAll('.quote'), n = box.querySelector('.quotes__n'), i = 0;
    function go(k) { qs[i].classList.remove('is-on'); i = (i + k + qs.length) % qs.length; qs[i].classList.add('is-on'); if (n) n.textContent = (i + 1) + ' / ' + qs.length; }
    box.querySelectorAll('[data-q]').forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-q')); goal('reviews_next'); }); });
    var sx = null;
    box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); sx = null; });
  });

  /* 3D-гантель: грузим лениво, только на широких экранах, без reduced-motion и при наличии WebGL */
  var h3 = d.querySelector('[data-3d]');
  if (h3 && !reduce && w.innerWidth >= 768 && 'IntersectionObserver' in w) {
    var ok = false;
    try { var c = d.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
    var conn2 = navigator.connection;
    if (ok && !(conn2 && conn2.saveData)) {
      var io3 = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io3.disconnect();
        var sc = d.createElement('script'); sc.src = h3.getAttribute('data-3d'); sc.async = true;
        sc.onload = function () { try { if (w.Kompas3D) w.Kompas3D.init(h3); } catch (e) {} };
        d.body.appendChild(sc);
      }, { rootMargin: '300px 0px' });
      io3.observe(h3);
    }
  }

})();

/* Калькулятор → заявка: переносим цель и параметры в форму */
(function () {
  var d = document;
  d.addEventListener('click', function (e) {
    if (!e.target.closest('[data-calc-cta]')) return;
    var g = d.getElementById('c-goal'), wn = d.querySelector('[name=weight_n]'), hn = d.querySelector('[name=height_n]');
    var note = d.getElementById('f-note'), view = d.getElementById('f-note-v');
    if (!note || !g) return;
    var txt = 'Из калькулятора: цель — ' + g.options[g.selectedIndex].text.toLowerCase() + (wn ? ', вес ' + wn.value + ' кг' : '') + (hn ? ', рост ' + hn.value + ' см' : '');
    note.value = txt;
    if (view) { view.textContent = txt + '. Тренер учтёт это в программе.'; view.hidden = false; }
  });
})();
