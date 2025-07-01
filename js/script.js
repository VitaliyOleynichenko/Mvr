// js/script.js

(() => {
  // Константы из config.js
  const API_BASE       = 'api';
  const CUT_ZONE       = { start: 0.33, end: 0.38 };
  const UPDATE_INTERVAL= 5000;
  const SLAB_HEIGHT    = 120;
  const SPLIT_OFFSET   = 50;

  // DOM-элементы
  const canvas       = document.getElementById('conveyor-canvas');
  const ctx          = canvas.getContext('2d');
  const indicatorEl  = document.getElementById('indicator');
  const stateTextEl  = document.getElementById('state-text');
  const buttons      = document.querySelectorAll('.buttons button');
  const navLinks     = document.querySelectorAll('.nav-link');
  const zone         = location.pathname.includes('mvr2') ? 'mvr2' : 'mvr1';

  // Состояние
  let slabs     = [];
  let state     = 'idle';
  let splitDone = false;
  let dataset   = localStorage.getItem(`dataset_${zone}`) || null;

  // Подсвечиваем активную вкладку в шапке
  function highlightNav() {
    const page = window.location.pathname.split('/').pop(); // mvr1.html или mvr2.html
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === page);
    });
  }
  highlightNav();

  // Настройка размера канваса
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight * 0.3;
    drawAll();
  }
  window.addEventListener('resize', resize);
  resize();

  // Обработчики кнопок демо-режима
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      dataset   = btn.dataset.ds;
      splitDone = false;
      localStorage.setItem(`dataset_${zone}`, dataset);
      loadAll();
    });
  });

  // Основная точка входа: загрузка и отрисовка
  async function loadAll() {
    await Promise.all([loadSlabs(), loadState()]);
    // Демо-режим: разделяем одну крата только для dataset=5 после фактического реза
    if (dataset === '5' && state === 'cutting' && !splitDone) {
      applySplit();
      splitDone = true;
    }
    drawAll();
  }

  // Запрос заготовок
  async function loadSlabs() {
    let url = `${API_BASE}/mvr.php?zone=${zone}`;
    if (dataset) url += `&dataset=${dataset}`;
    try {
      const res = await fetch(url);
      slabs = await res.json();
    } catch {
      slabs = [];
    }
  }

  // Запрос состояния агрегата
  async function loadState() {
    let url = `${API_BASE}/signals.php?zone=${zone}`;
    if (dataset) url += `&dataset=${dataset}`;
    try {
      const res = await fetch(url);
      const obj = await res.json();
      state = obj.state || 'idle';
    } catch {
      state = 'idle';
    }
    indicatorEl.className = `indicator indicator--${state}`;
    stateTextEl.textContent = state === 'cutting' ? 'Режет…' : 'Ожидание реза';
  }

  // Логика «отрезания» одной крата
  function applySplit() {
    const x0 = CUT_ZONE.start * canvas.width;
    const x1 = CUT_ZONE.end   * canvas.width;
    // Ищем заготовку, центр которой в зоне реза и krat>1
    const target = slabs.find(s => {
      const center = s.x + s.length / 2;
      return center >= x0 && center <= x1 && s.krat > 1;
    });
    if (!target) return;

    const maxId = Math.max(...slabs.map(s => s.id));
    const originalKrat = target.krat;
    const partLen = target.length / originalKrat;

    // Уменьшаем родительскую кратность и длину
    target.krat   = originalKrat - 1;
    target.length = target.krat * partLen;

    // Создаём новую заготовку-крату справа от зоны реза
    const newX = x1 + SPLIT_OFFSET;
    slabs.push({
      id:     maxId + 1,
      x:      Math.round(newX),
      y:      target.y,
      length: Math.round(partLen),
      krat:   1
    });
  }

  // Рисуем всю сцену
  function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConveyor();
    slabs.forEach(drawSlab);
  }

  // Рисуем рольганг с текстурой и зону реза
  function drawConveyor() {
    ctx.fillStyle = '#777';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const x0 = CUT_ZONE.start * canvas.width;
    const x1 = CUT_ZONE.end   * canvas.width;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x0, 0, x1 - x0, canvas.height);
  }

  // Рисуем одну заготовку
  function drawSlab(s) {
    ctx.fillStyle   = '#e08a3a';
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 2;
    ctx.fillRect(s.x, s.y, s.length, SLAB_HEIGHT);
    ctx.strokeRect(s.x, s.y, s.length, SLAB_HEIGHT);

    if (s.krat > 1) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      for (let i = 1; i < s.krat; i++) {
        const px = s.x + i * (s.length / s.krat);
        ctx.beginPath();
        ctx.moveTo(px, s.y);
        ctx.lineTo(px, s.y + SLAB_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Live-режим: обновляем каждые UPDATE_INTERVAL мс; демо — только по кнопке
  if (!dataset) {
    loadAll();
    setInterval(loadAll, UPDATE_INTERVAL);
  } else {
    loadAll();
  }
})();
