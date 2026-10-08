/* Калькулятор «Компаса»: ИМТ, калории, БЖУ, программа и силуэт. Ориентир, не медицинская рекомендация. */
(function () {
  var root = document.getElementById('calc');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var NB = ' ';
  var FWD = /(^|[\s(«])(в|во|к|с|со|у|о|от|до|по|на|за|из|без|для|при|под|и|а|но|не|ни|или|что|как|чем|уже|ещё)\s+/gi;
  function typo(s) {
    s = s.replace(FWD, function (m, a, w) { return a + w + NB; }).replace(/ (—|–) /g, NB + '$1 ').replace(/(\d) (кг|ккал|г|л|мл|см|раз|раза|мин|недель|нед\.)/g, '$1' + NB + '$2');
    s = s.replace(/(\d)–(\d)/g, '$1–\u2060$2');
    return s.replace(/(\S+) (\S+)$/, function (m, a, b) { return (a.length + b.length <= 26) ? a + NB + b : m; });
  }
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function goal(n) { try { if (window.ym && window.KOMPAS && window.KOMPAS.metrika) window.ym(window.KOMPAS.metrika, 'reachGoal', n); } catch (e) {} }

  var inputs = root.querySelectorAll('input,select');
  var used = false;

  /* ---------- Силуэт ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(pts) { // Catmull-Rom -> Безье
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function mirror(pts) { return pts.slice().reverse().map(function (p) { return [200 - p[0], p[1]]; }); }
  function body(bmi, male) {
    var t = Math.max(0, Math.min(1, (bmi - 16) / 22));
    var P = male
      ? { nw: lerp(7, 11, t), S: lerp(37, 50, t), C: lerp(29, 50, t), W: lerp(23, 55, t), H: lerp(27, 52, t), th: lerp(14, 25, t), kn: lerp(9, 15, t), an: lerp(5.5, 8, t), arm: lerp(8, 15, t), fa: lerp(6, 11, t) }
      : { nw: lerp(6, 10, t), S: lerp(31, 44, t), C: lerp(27, 47, t), W: lerp(19, 50, t), H: lerp(31, 58, t), th: lerp(15, 27, t), kn: lerp(8.5, 14, t), an: lerp(5, 7.5, t), arm: lerp(7, 14, t), fa: lerp(5.5, 10, t) };
    var x = function (v) { return 100 + v; };
    var legC = Math.max(P.H * 0.48, 12 + P.th * 0.5);
    var right = [
      [x(P.nw), 46], [x(P.nw), 58], [x(P.S * 0.72), 64], [x(P.S), 76],
      [x(P.C), 104], [x(P.W), 150], [x(P.H), 190],
      [x(legC + P.th), 228], [x(legC + P.kn + 1), 300], [x(legC - 1 + P.an), 382], [x(legC + P.an + 9), 404], [x(legC + P.an + 6), 410],
      [x(legC - P.an - 3), 410], [x(legC - P.an), 384], [x(legC - P.kn + 1), 300], [x(Math.max(2.5, legC - P.th + 2)), 232], [x(1.5), 218]
    ];
    var torso = smooth(right.concat(mirror(right).slice(1))) + 'Z';
    // руки
    function arm(side) {
      var s = side, sx = 100 + s * (P.S - 3), bx = 100 + s * (Math.max(P.C, P.W) + P.arm * 0.55 + 2);
      var o = [[sx, 70], [sx + s * P.arm * 0.9, 90], [bx + s * P.arm * 0.5, 150], [bx + s * P.fa * 0.5 + s * 2, 212], [bx + s * 3, 226]];
      var inn = [[bx - s * 3, 226], [bx - s * P.fa * 0.5 + s * 1, 212], [bx - s * P.arm * 0.5, 150], [100 + s * (P.C - 2), 100], [sx - s * 6, 80]];
      return smooth(o.concat(inn)) + 'Z';
    }
    return { torso: torso, arms: arm(1) + arm(-1) };
  }
  var svg = $('.calc__svg');
  var gH = svg.querySelector('.fig-now'), gT = svg.querySelector('.fig-target');
  function draw(g, bmi, male, hcm) {
    var b = body(bmi, male);
    g.querySelector('.head').setAttribute('cy', 30);
    g.querySelector('.armsP').setAttribute('d', b.arms);
    g.querySelector('.torsoP').setAttribute('d', b.torso);
    var s = (hcm * 2) / 400; // 1 см = 2 ед.; фигура 400 ед. = рост
    g.setAttribute('transform', 'translate(100 450) scale(' + s.toFixed(3) + ') translate(-100 -412)');
  }

  /* ---------- Программы ---------- */
  var PROG = {
    lose: {
      novice: { days: [1, 0, 1, 0, 1, 0, 0], title: '3 тренировки в неделю на всё тело', note: 'Силовая 40–45 минут, затем 20 минут кардио в умеренном темпе. Подходы по 12–15 повторов, отдых 60–90 секунд.', ex: ['Жим ногами в тренажёре — 3×12–15', 'Тяга верхнего блока — 3×12–15', 'Жим гантелей сидя — 3×12', 'Тяга горизонтального блока — 3×12–15', 'Сгибание ног в тренажёре — 3×15', 'Планка — 3 × 30–40 секунд'] },
      exp: { days: [1, 1, 0, 1, 1, 0, 0], title: '4 тренировки: верх и низ по очереди', note: 'Силовая 50 минут, 2–3 раза в неделю добавь 25–30 минут кардио. Подходы по 10–12 повторов.', ex: ['Приседания или жим ногами — 4×10', 'Румынская тяга с гантелями — 3×10–12', 'Жим штанги лёжа — 4×8–10', 'Тяга штанги в наклоне — 4×10', 'Выпады с гантелями — 3×12', 'Кардио — 25 минут'] }
    },
    keep: {
      novice: { days: [1, 0, 1, 0, 1, 0, 0], title: '3 тренировки в неделю на всё тело', note: 'Каждое упражнение по 3 подхода на 10–12 повторов. Вес растёт, когда последние повторы даются легко.', ex: ['Жим ногами — 3×10–12', 'Тяга верхнего блока — 3×10–12', 'Жим гантелей лёжа — 3×10', 'Тяга гантели в наклоне — 3×10', 'Подъём гантелей на бицепс — 2×12', 'Разгибание рук на блоке — 2×12'] },
      exp: { days: [1, 0, 1, 0, 1, 0, 0], title: '3 тренировки: тяни, толкай, ноги', note: 'Подходы по 8–12 повторов, 1–2 упражнения доводи почти до отказа.', ex: ['Жим штанги лёжа — 4×8', 'Подтягивания или тяга блока — 4×8–10', 'Приседания — 4×8', 'Становая тяга — 3×6', 'Жим гантелей сидя — 3×10', 'Подъём ног в висе — 3×12'] }
    },
    gain: {
      novice: { days: [1, 0, 1, 0, 1, 0, 0], title: '3 тренировки в неделю на всё тело', note: 'Базовые упражнения по 3–4 подхода на 8–12 повторов, отдых 2 минуты. Каждую неделю добавляй вес или повтор.', ex: ['Жим ногами или приседания — 4×8–10', 'Жим штанги лёжа — 4×8–10', 'Тяга верхнего блока — 4×10', 'Жим гантелей сидя — 3×10', 'Тяга гантели в наклоне — 3×10', 'Подъём штанги на бицепс — 3×10'] },
      exp: { days: [1, 1, 0, 1, 1, 0, 0], title: '4 тренировки: верх и низ по очереди', note: 'Тяжёлые базовые по 4 подхода на 6–8 повторов, затем вспомогательные на 10–12. Сон от 7–8 часов.', ex: ['Приседания со штангой — 4×6–8', 'Жим штанги лёжа — 4×6–8', 'Становая тяга — 3×5–6', 'Подтягивания с весом — 4×6–8', 'Жим гантелей на наклонной — 3×10', 'Сгибание ног в тренажёре — 3×12'] }
    }
  };
  var DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  function val(name) { var el = root.querySelector('[name="' + name + '"]:checked') || root.querySelector('[name="' + name + '"]'); return el ? el.value : ''; }
  function setText(sel, s) { var el = $(sel); if (el) el.textContent = typo(s); }

  function calc() {
    var male = val('sex') === 'm';
    var age = Math.min(80, Math.max(14, +val('age') || 25));
    var h = Math.min(210, Math.max(140, +val('height') || 175));
    var w = Math.min(200, Math.max(40, +val('weight') || 80));
    var act = +val('act') || 1.375;
    var g = val('goal'), lvl = val('lvl');
    $('.calc__wout').textContent = w + ' кг';
    $('.calc__hout').textContent = h + ' см';
    var m = h / 100, bmi = w / (m * m);
    var notes = [];
    var effGoal = g;
    if (g === 'lose' && bmi < 20) { effGoal = 'keep'; notes.push('При твоём весе худеть не нужно. Лучше укрепить мышцы: считаем калории на поддержание. Обсуди цель с тренером.'); }
    if (age < 18 && g === 'lose') { effGoal = 'keep'; notes.push('До 18 лет не стоит урезать калории: организм ещё растёт. Тренируйся и ешь на поддержание, а программу собери с тренером.'); }
    if (bmi >= 35) notes.push('При таком весе перед началом тренировок лучше показаться врачу, а первые занятия провести с тренером.');
    if (bmi < 17) notes.push('Вес заметно ниже нормы. Перед тренировками стоит посоветоваться с врачом.');

    var bmr = 10 * w + 6.25 * h - 5 * age + (male ? 5 : -161);
    var tdee = bmr * act;
    var kcal = effGoal === 'lose' ? Math.max(bmr, tdee * 0.85) : effGoal === 'gain' ? tdee * 1.1 : tdee;
    var pw = bmi > 30 ? 27 * m * m : w; // для расчёта белка при большом весе
    var prot = pw * (effGoal === 'keep' ? 1.6 : 1.8), fat = pw * 0.9;
    var carb = Math.max(0, (kcal - prot * 4 - fat * 9) / 4);
    var water = Math.min(3.5, w * 0.03);
    var cat = bmi < 18.5 ? ['ниже нормы', 'low'] : bmi < 25 ? ['в норме', 'ok'] : bmi < 30 ? ['выше нормы', 'mid'] : ['значительно выше нормы', 'high'];
    var lo = 18.5 * m * m, hi = 24.9 * m * m;

    $('.calc__bmi b').textContent = bmi.toFixed(1).replace('.', ',');
    var tag = $('.calc__bmi span'); tag.textContent = cat[0]; tag.className = 'calc__tag is-' + cat[1];
    setText('.calc__range', 'Здоровый диапазон при твоём росте: ' + Math.round(lo) + '–' + Math.round(hi) + ' кг');
    $('.k-kcal').textContent = fmt(kcal); $('.k-p').textContent = fmt(prot); $('.k-f').textContent = fmt(fat); $('.k-c').textContent = fmt(carb);
    $('.k-w').textContent = water.toFixed(1).replace('.', ',');
    // шкала ИМТ
    var pos = Math.max(0, Math.min(100, (bmi - 15) / 25 * 100));
    $('.calc__scale i').style.left = pos + '%';

    // цель через 12 недель
    var target = w, tl = '';
    if (effGoal === 'lose') { target = Math.max(w * (1 - 0.0065 * 12), 21 * m * m); tl = 'Через 12 недель: около ' + Math.round(target) + ' кг'; }
    else if (effGoal === 'gain') { target = w * 1.03; tl = 'Через 12 недель: около ' + Math.round(target) + ' кг, в основном мышцы'; }
    else tl = 'Цель: держать вес и укреплять мышцы';
    setText('.calc__target', tl);
    draw(gH, bmi, male, h);
    if (target !== w) { gT.style.display = ''; draw(gT, target / (m * m), male, h); } else gT.style.display = 'none';
    var lgT = root.querySelector('.lg-t'); if (lgT) lgT.style.display = target !== w ? '' : 'none';
    $('.calc__fig').setAttribute('aria-label', 'Силуэт: рост ' + h + ' см, вес ' + w + ' кг');

    // программа
    var p = PROG[effGoal][lvl === 'exp' ? 'exp' : 'novice'];
    setText('.p-title', p.title); setText('.p-note', p.note);
    $('.p-week').innerHTML = p.days.map(function (d, i) { return '<li class="' + (d ? 'is-on' : '') + '"><b>' + DAYS[i] + '</b><span>' + (d ? 'зал' : 'отдых') + '</span></li>'; }).join('');
    $('.p-ex').innerHTML = p.ex.map(function (e) { return '<li>' + typo(e) + '</li>'; }).join('');
    // питание
    var meals = [['Завтрак', .25, 'каша, яйца или творог, фрукт'], ['Обед', .35, 'мясо или рыба, крупа, овощи'], ['Перекус', .1, 'йогурт, орехи или банан'], ['Ужин', .3, 'птица или рыба, овощи, немного крупы']];
    $('.n-meals').innerHTML = meals.map(function (x) { return '<li><b>' + x[0] + ' — ' + fmt(kcal * x[1]) + ' ккал</b><span>' + typo(x[2]) + '</span></li>'; }).join('');
    var nn = $('.calc__notes'); nn.innerHTML = notes.map(function (n) { return '<p>' + typo(n) + '</p>'; }).join(''); nn.hidden = !notes.length;
  }
  inputs.forEach(function (el) {
    el.addEventListener('input', function () { calc(); if (!used) { used = true; goal('calc_use'); } });
    el.addEventListener('change', calc);
  });
  // синхронизация ползунков и полей
  [['weight', 'weight_n'], ['height', 'height_n']].forEach(function (pair) {
    var r = root.querySelector('[name="' + pair[0] + '"]'), n = root.querySelector('[name="' + pair[1] + '"]');
    if (!r || !n) return;
    r.addEventListener('input', function () { n.value = r.value; });
    n.addEventListener('input', function () { if (+n.value >= +r.min && +n.value <= +r.max) { r.value = n.value; calc(); } });
  });
  calc();
})();
