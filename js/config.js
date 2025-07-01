// Базовый путь к API
const API_BASE = 'api';

// Зона резки (доли ширины canvas)
const CUT_ZONE = { start: 0.33, end: 0.38 };

// Частота обновления live-режима (мс)
const UPDATE_INTERVAL = 5000;

// Высота заготовки (в пикселях)
const SLAB_HEIGHT = 120;

// Сдвиг новой сплит-краты от зоны резки (в пикселях)
const SPLIT_OFFSET = 50;