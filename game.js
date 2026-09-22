(() => {
  'use strict';

  const GAME_SECONDS = 60;
  const board = document.querySelector('#board');
  const scoreEl = document.querySelector('#score');
  const levelEl = document.querySelector('#level');
  const timeEl = document.querySelector('#time');
  const timerFill = document.querySelector('#timerFill');
  const startLayer = document.querySelector('#startLayer');
  const resultLayer = document.querySelector('#resultLayer');
  const startButton = document.querySelector('#startButton');
  const restartButton = document.querySelector('#restartButton');
  const soundButton = document.querySelector('#soundButton');
  const finalScore = document.querySelector('#finalScore');
  const resultTitle = document.querySelector('#resultTitle');
  const resultCopy = document.querySelector('#resultCopy');
  const hint = document.querySelector('#hint');

  let score = 0;
  let timeLeft = GAME_SECONDS;
  let targetIndex = 0;
  let running = false;
  let acceptingInput = false;
  let timerId = null;
  let roundTimeout = null;
  let audioEnabled = true;
  let audioContext = null;

  const evaluations = [
    { max: 10, title: '色彩萌新', copy: '眼睛正在热身，再来一次就更敏锐。' },
    { max: 20, title: '观察达人', copy: '细微变化也逃不过你，状态很不错。' },
    { max: 30, title: '鹰眼', copy: '一眼锁定目标，你的视觉雷达很可靠。' },
    { max: 40, title: '色彩猎手', copy: '颜色藏得再深，也会被你精准捕获。' },
    { max: Infinity, title: '人形校色仪', copy: '这双眼睛，建议纳入专业设备管理。' }
  ];

  function gridSizeFor(currentScore) {
    if (currentScore < 3) return 2;
    if (currentScore < 7) return 3;
    if (currentScore < 12) return 4;
    if (currentScore < 18) return 5;
    if (currentScore < 25) return 6;
    if (currentScore < 33) return 7;
    if (currentScore < 42) return 8;
    return Math.min(10, 9 + Math.floor((currentScore - 42) / 12));
  }

  function colorDifferenceFor(currentScore) {
    return Math.max(4.5, 16 - currentScore * 0.23);
  }

  function createPalette() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 48 + Math.floor(Math.random() * 25);
    const lightness = 48 + Math.floor(Math.random() * 18);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const difference = colorDifferenceFor(score) * direction;
    return {
      normal: `hsl(${hue} ${saturation}% ${lightness}%)`,
      odd: `hsl(${hue} ${saturation}% ${Math.max(28, Math.min(79, lightness + difference))}%)`
    };
  }

  function renderRound() {
    if (!running) return;
    acceptingInput = false;
    board.classList.add('changing');
    window.clearTimeout(roundTimeout);

    roundTimeout = window.setTimeout(() => {
      const size = gridSizeFor(score);
      const total = size * size;
      const palette = createPalette();
      targetIndex = Math.floor(Math.random() * total);
      board.replaceChildren();
      board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      board.style.setProperty('--gap', `${Math.max(4, 12 - size)}px`);
      board.style.setProperty('--tile-radius', `${Math.max(7, 16 - size)}px`);

      const fragment = document.createDocumentFragment();
      for (let index = 0; index < total; index += 1) {
        const tile = document.createElement('button');
        tile.className = 'tile';
        tile.type = 'button';
        tile.setAttribute('role', 'gridcell');
        tile.setAttribute('aria-label', `第 ${index + 1} 个色块`);
        tile.style.setProperty('--tile-color', index === targetIndex ? palette.odd : palette.normal);
        tile.addEventListener('click', () => handleChoice(tile, index));
        fragment.appendChild(tile);
      }
      board.appendChild(fragment);
      levelEl.textContent = String(score + 1);
      board.classList.remove('changing');
      acceptingInput = true;
    }, score === 0 ? 30 : 130);
  }

  function handleChoice(tile, index) {
    if (!running || !acceptingInput) return;
    tile.classList.add('pressed');
    window.setTimeout(() => tile.classList.remove('pressed'), 140);

    if (index === targetIndex) {
      acceptingInput = false;
      tile.classList.add('correct');
      score += 1;
      scoreEl.textContent = String(score);
      hint.textContent = ['找到啦，继续！', '很敏锐！', '漂亮，再来一组。'][score % 3];
      hint.className = 'hint success';
      playTone(620, 0.055, 'sine');
      if (navigator.vibrate) navigator.vibrate(18);
      window.setTimeout(() => {
        hint.textContent = '凭直觉，点出颜色略有不同的那一格';
        hint.className = 'hint';
        renderRound();
      }, 300);
    } else {
      tile.classList.remove('wrong');
      void tile.offsetWidth;
      tile.classList.add('wrong');
      hint.textContent = '不是这格，再仔细看看';
      hint.className = 'hint error';
      playTone(180, 0.045, 'triangle');
      window.setTimeout(() => {
        if (!running) return;
        hint.textContent = '凭直觉，点出颜色略有不同的那一格';
        hint.className = 'hint';
      }, 650);
    }
  }

  function beginGame() {
    window.clearInterval(timerId);
    window.clearTimeout(roundTimeout);
    score = 0;
    timeLeft = GAME_SECONDS;
    running = true;
    scoreEl.textContent = '0';
    levelEl.textContent = '1';
    timeEl.textContent = String(GAME_SECONDS);
    timerFill.style.transform = 'scaleX(1)';
    timerFill.classList.remove('urgent');
    startLayer.hidden = true;
    resultLayer.hidden = true;
    board.classList.add('active');
    hint.textContent = '凭直觉，点出颜色略有不同的那一格';
    hint.className = 'hint';
    playTone(440, 0.06, 'sine');
    renderRound();

    const startedAt = performance.now();
    timerId = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const preciseLeft = Math.max(0, GAME_SECONDS - elapsed);
      timeLeft = Math.ceil(preciseLeft);
      timeEl.textContent = String(timeLeft);
      timerFill.style.transform = `scaleX(${preciseLeft / GAME_SECONDS})`;
      if (timeLeft <= 10) timerFill.classList.add('urgent');
      if (preciseLeft <= 0) finishGame();
    }, 100);
  }

  function finishGame() {
    if (!running) return;
    running = false;
    acceptingInput = false;
    window.clearInterval(timerId);
    window.clearTimeout(roundTimeout);
    timeEl.textContent = '0';
    timerFill.style.transform = 'scaleX(0)';
    board.classList.remove('active');
    const evaluation = evaluations.find(item => score <= item.max);
    finalScore.textContent = String(score);
    resultTitle.textContent = evaluation.title;
    resultCopy.textContent = evaluation.copy;
    resultLayer.hidden = false;
    hint.textContent = '每一次挑战，颜色都会重新随机生成';
    hint.className = 'hint';
    playTone(330, 0.12, 'sine');
  }

  function playTone(frequency, duration, type) {
    if (!audioEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) {
      audioEnabled = false;
      soundButton.setAttribute('aria-pressed', 'false');
    }
  }

  function toggleSound() {
    audioEnabled = !audioEnabled;
    soundButton.setAttribute('aria-pressed', String(audioEnabled));
    soundButton.setAttribute('aria-label', audioEnabled ? '关闭音效' : '开启音效');
    if (audioEnabled) playTone(520, 0.05, 'sine');
  }

  startButton.addEventListener('click', beginGame);
  restartButton.addEventListener('click', beginGame);
  soundButton.addEventListener('click', toggleSound);

  board.style.gridTemplateColumns = 'repeat(3, 1fr)';
  board.style.setProperty('--gap', '10px');
  const previewPalette = { normal: '#9dadcd', odd: '#b7c2da' };
  for (let index = 0; index < 9; index += 1) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.setProperty('--tile-color', index === 7 ? previewPalette.odd : previewPalette.normal);
    board.appendChild(tile);
  }
})();

