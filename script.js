// ===============================
// GLOBAL VOLUME SETUP
// ===============================
function updateSliderBar(value) {
  const vs = document.getElementById("volumeSlider");
  if (vs) {
    vs.style.background =
      `linear-gradient(90deg, #ff7eb3 ${value}%, #ffffff33 ${value}%)`;
  }
}

// ===============================
// AUDIO SYSTEM (WEB AUDIO API)
// ===============================
const audioElement = document.getElementById('bgMusic');

let audioCtx = null;
let sourceNode = null;
let gainNode = null;
let audioStarted = false;

function initAudioContextIfNeeded() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioCtx.createMediaElementSource(audioElement);
  gainNode = audioCtx.createGain();

  sourceNode.connect(gainNode).connect(audioCtx.destination);

  const saved = localStorage.getItem('globalVolume');
  const initial = saved !== null ? Number(saved) : 1;
  gainNode.gain.value = initial;

  const vs = document.getElementById('volumeSlider');
  if (vs) {
    vs.value = initial;
    updateSliderBar(initial * 100);
  }
}

document.getElementById('volumeSlider')?.addEventListener('input', function () {
  const vol = Number(this.value);
  if (gainNode) gainNode.gain.value = vol;
  localStorage.setItem('globalVolume', vol);
  updateSliderBar(vol * 100);
});

function startAudio() {
  initAudioContextIfNeeded();

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(()=>{});
  }

  if (audioStarted) {
    audioElement.play().catch(()=>{});
    return;
  }

  audioStarted = true;
  gainNode.gain.value = 0;
  audioElement.play().catch(()=>{});

  const target = Number(localStorage.getItem('globalVolume') || 1);
  let step = 0;
  const steps = 40;

  const fade = setInterval(() => {
    step++;
    gainNode.gain.value = Math.min(target, (target / steps) * step);
    if (step >= steps) clearInterval(fade);
  }, 25);
}

function fadeOutMusic(callback) {
  if (!gainNode) return callback && callback();

  let v = gainNode.gain.value;
  const fade = setInterval(() => {
    v -= 0.01;
    gainNode.gain.value = Math.max(0, v);
    if (v <= 0) {
      clearInterval(fade);
      callback && callback();
    }
  }, 100);
}

document.addEventListener('click', initAudioContextIfNeeded, { once: true });

// ===============================
// GATE DATA
// ===============================
const gates = [
  {id:1,text:"How's your day?"},
  {id:2,text:"Hope you're having a good day! Are you feeling happy today?"},
  {id:3,text:"I hope today feels happy for you"},
  {id:4,text:"As the candles glow, take a moment to think about your wishes and dreams"},
  {id:5,text:"Whatever it is, your dreams are as beautiful as who you are 🫣"},
  {id:6,text:"You inspire me to be better than I was yesterday"},
  {id:7,text:"Your Special Day: February 8! 🎉"},
  {id:8,text:"Congratulations! Here We Go!"}
];

// ===============================
// ELEMENTS
// ===============================
const gateContainer = document.getElementById('gateContainer');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const modalVisual = document.getElementById('modalVisual');
const modalClose = document.getElementById('modalClose');
const confettiWrap = document.getElementById('confetti');

let currentGate = 1;

// ===============================
// CREATE GATES
// ===============================
for (let g of gates) {
  const el = document.createElement('div');
  el.className = 'gate';
  el.dataset.id = g.id;
  el.textContent = g.id;

  if (g.id !== 1) el.classList.add('disabled');

  el.addEventListener('click', () => openGate(g.id, el));

  const flash = document.createElement('span');
  flash.className = 'flash';
  el.appendChild(flash);

  gateContainer.appendChild(el);
}

// ===============================
// OPEN GATE
// ===============================
function openGate(id, el) {
  startAudio();
  if (id !== currentGate) return;

  el.classList.add('opening');

  setTimeout(() => {
    el.classList.remove('opening');
    el.classList.add('open');

    showModalFor(id);

    currentGate++;
    const nextGate = document.querySelector(`.gate[data-id="${currentGate}"]`);
    if (nextGate) nextGate.classList.remove('disabled');
  }, 300);
}

// ===============================
// MODAL LOGIC
// ===============================
function showModalFor(id) {
  const gate = gates.find(g => g.id === id);
  modalVisual.innerHTML = '';
  modalText.innerHTML = '';

  if (id === 4) {
    const box = document.createElement('div');
    box.className = 'candles';
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('div');
      c.className = 'candle';
      box.appendChild(c);
    }
    modalVisual.appendChild(box);
  }

  if (id === 7) {
    const e8 = document.createElement('div');
    e8.className = 'glow-eight';
    e8.textContent = '8';
    modalVisual.appendChild(e8);
  }

  modal.classList.add('show');

  // ===== GATE 8 (FINAL) =====
  if (id === 8) {
    typeText(gate.text, 40, () => {
      launchConfetti(40);
      fadeOutMusic(() => {
        document.body.style.transition = "opacity 3s ease";
        document.body.style.opacity = 0;
        setTimeout(() => {
          window.location.href = "https://galvino-cyber.github.io/ucapan/";
        }, 3000);
      });
    });
    return;
  }

  // ===== NORMAL GATE =====
  typeText(gate.text);
}

// ===============================
// MODAL CLOSE (INI PENTING)
// ===============================
modalClose.addEventListener('click', () => {
  modal.classList.remove('show');
});

// ===============================
// TYPEWRITER EFFECT
// ===============================
function typeText(text, speed = 40, onComplete) {
  modalText.innerHTML = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      modalText.innerHTML += text[i];
      i++;
      setTimeout(type, speed);
    } else {
      if (onComplete) onComplete();
    }
  }
  type();
}

// ===============================
// CONFETTI
// ===============================
function launchConfetti(count = 100) {
  const colors = ['#ffd1dc','#ffd89b','#c8f7ff','#b9fbc0','#f6c3ff','#fff1a8','#ffd6ff','#cfe9ff'];
  for (let i = 0; i < count; i++) {
    const node = document.createElement('i');
    node.style.left = Math.random() * 100 + '%';
    node.style.top = '-10px';
    node.style.background = colors[Math.floor(Math.random() * colors.length)];
    node.style.width = (6 + Math.random() * 10) + 'px';
    node.style.height = (8 + Math.random() * 16) + 'px';
    node.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
    confettiWrap.appendChild(node);
    setTimeout(() => node.remove(), 2600);
  }
}