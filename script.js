// --- GLOBAL VOLUME SETUP ---
// -----------------------------
// Helper: updateSliderBar
// (pastikan ini ada sebelum dipanggil)
// -----------------------------
function updateSliderBar(value) {
  const percent = value;
  const vs = document.getElementById("volumeSlider");
  if (vs) {
    vs.style.background =
      `linear-gradient(90deg, #ff7eb3 ${percent}%, #ffffff33 ${percent}%)`;
  }
}

// ======== GANTI DENGAN BLOCK AUDIO INI (paste menggantikan kode audio yang lama) ========

// Elemen audio
const audioElement = document.getElementById('bgMusic');

// Web Audio API vars
let audioCtx = null;
let sourceNode = null;
let gainNode = null;

// Flag untuk memastikan fade-in hanya sekali
let audioStarted = false;

// Inisialisasi AudioContext + GainNode (dipanggil setelah gesture pertama)
function initAudioContextIfNeeded() {
  if (audioCtx) return; // sudah diinisialisasi
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioCtx.createMediaElementSource(audioElement);
  gainNode = audioCtx.createGain();
  sourceNode.connect(gainNode).connect(audioCtx.destination);

  // set volume dari storage (atau default 1 karena kode lama pakai 1)
  const saved = localStorage.getItem('globalVolume');
  const initial = saved !== null ? Number(saved) : 1;
  gainNode.gain.value = initial;

  // sync slider visual
  const vs = document.getElementById('volumeSlider');
  if (vs) {
    vs.value = initial;
    updateSliderBar(initial * 100); // kalau garis neon tetap butuh 0–100
  }
}

// === EVENT SLIDER — TEMPATKAN PERSIS DI SINI ===
document.getElementById('volumeSlider')?.addEventListener('input', function () {
  const vol = Number(this.value); // 0–1
  if (gainNode) {
    gainNode.gain.value = vol;
  }

  localStorage.setItem('globalVolume', vol);
  updateSliderBar(vol * 100);
});

// Fungsi safe untuk memulai audio — fade-in hanya sekali
function startAudio() {
  initAudioContextIfNeeded();

  // resume audio context (autoplay policy)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(()=>{});
  }

  // Pastikan kita tidak menjalankan fade-in lebih dari sekali
  if (audioStarted) {
    // kalau belum diputar pastikan element diputar tanpa fade
    audioElement.play().catch(()=>{});
    return;
  }
  audioStarted = true;

  // set volume 0 lalu play
  gainNode.gain.value = 0;
  audioElement.currentTime = audioElement.currentTime || 0;
  audioElement.play().catch(()=>{});

  // Fade-in bertahap menuju target (target berasal dari stored volume)
  const target = Number(localStorage.getItem('globalVolume') || 1);
  let t = 0;
  const steps = 40; // 40 langkah
  const stepAmount = target / steps;
  const interval = setInterval(()=>{
    t += 1;
    gainNode.gain.value = Math.min(stepAmount * t, target);
    if (t >= steps) clearInterval(interval);
  }, 25); // total ~1s (40*25=1000ms)
}

// Fade-out menggunakan GainNode — panggil hanya saat Gate 8
function fadeOutMusic(callback){
  if (!gainNode) {
    if (callback) callback();
    return;
  }
  let v = gainNode.gain.value;
  const interval = setInterval(()=>{
    v -= 0.005;
    gainNode.gain.value = Math.max(0, v);
    if (v <= 0) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 50);
}

// Pastikan audio context diinisialisasi setelah gesture pertama pengguna
document.addEventListener('click', () => {
  initAudioContextIfNeeded();
  // jangan langsung fade-in di click; biarkan startAudio() yang mengontrol saat buka gate 1
}, { once: true });

// ======== END OF REPLACEMENT BLOCK ========


// =========================================================
// ================ ORIGINAL JAVASCRIPT ====================
// =========================================================

const gates = [
  {id:1,text:"How's your day?"},
  {id:2,text:"Hope you're having a good day! Are you feeling happy today?"},
  {id:3,text:"No matter how today feels, your smile has a way of making things a little better"},
  {id:4,text:"With the candles glowing, take a quiet moment to think about your wish and dream"},
  {id:5,text:"Whatever it is, your dreams are just as beautiful as the person you are 🫣"},
  {id:6,text:"Being around you feels gentle, like a calm moment in a busy day"},
  {id:7,text:"Your Special Day: February 8! 🎉"},
  {id:8,text:"Congratulations! You made it to the final gate!"}
];

const gateContainer = document.getElementById('gateContainer');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const modalVisual = document.getElementById('modalVisual');
const modalClose = document.getElementById('modalClose');
const confettiWrap = document.getElementById('confetti');
const bgAudio = document.getElementById('bgMusic');

let currentGate = 1;
// <-- NOTE: removed duplicate `let audioStarted = false;` here (audioStarted already declared above)

for(let g of gates){
  const el = document.createElement('div');
  el.className = 'gate';
  el.dataset.id = g.id;
  el.textContent = g.id;
  if(g.id!==1) el.classList.add('disabled');
  el.addEventListener('click',()=> openGate(g.id,el));
  const flash = document.createElement('span');
  flash.className = 'flash';
  el.appendChild(flash);
  gateContainer.appendChild(el);
}

function openGate(id, el){
  startAudio();
  if(id!==currentGate) return;

  el.classList.add('opening');
  setTimeout(()=>{
    el.classList.remove('opening');
    el.classList.add('open');
    showModalFor(id);
    currentGate++;
    const nextGate = document.querySelector(`.gate[data-id="${currentGate}"]`);
    if(nextGate) nextGate.classList.remove('disabled');
  },300);
}

function showModalFor(id){
  const gate = gates.find(g=>g.id===id);
  modalVisual.innerHTML='';
  modalText.innerHTML='';

  if(id===4){
    const box = document.createElement('div');
    box.className='candles';
    for(let i=0;i<5;i++){
      const c = document.createElement('div');
      c.className='candle';
      box.appendChild(c);
    }
    modalVisual.appendChild(box);
  }

  else if(id===7){
    const e8 = document.createElement('div');
    e8.className='glow-eight';
    e8.textContent='8';
    modalVisual.appendChild(e8);
  }

  modal.classList.add('show');
  typeText(gate.text);

  if(id === 8){
    setTimeout(() => launchConfetti(40), 400);

    fadeOutMusic(() => {
      document.body.style.opacity = 0;
      setTimeout(() => {
        window.location.href = "https://galvino-cyber.github.io/ucapan/";
      }, 4000);
    });
  }
}      

modalClose.addEventListener('click',()=> modal.classList.remove('show'));

function typeText(text,speed=40){
  modalText.innerHTML='';
  let i=0;
  function type(){
    if(i<text.length){
      modalText.innerHTML+=text[i];
      i++;
      setTimeout(type,speed);
    }
  }
  type();
}

function launchConfetti(count=100){
  const colors=['#ffd1dc','#ffd89b','#c8f7ff','#b9fbc0','#f6c3ff','#fff1a8','#ffd6ff','#cfe9ff'];
  for(let i=0;i<count;i++){
    const node=document.createElement('i');
    node.style.left=Math.random()*100+'%';
    node.style.top='-10px';
    node.style.background=colors[Math.floor(Math.random()*colors.length)];
    node.style.width=(6+Math.random()*10)+'px';
    node.style.height=(8+Math.random()*16)+'px';
    node.style.animationDuration=(1.8+Math.random()*1.2)+'s';
    confettiWrap.appendChild(node);
    setTimeout(()=>node.remove(),2600);
  }
}