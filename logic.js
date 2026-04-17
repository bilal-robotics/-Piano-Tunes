// ─── PIANO CORE ───────────────────────────────────────────────────────────────
const OCTAVE_NOTES = [
  { note:'C',  type:'w' },
  { note:'C#', type:'b' },
  { note:'D',  type:'w' },
  { note:'D#', type:'b' },
  { note:'E',  type:'w' },
  { note:'F',  type:'w' },
  { note:'F#', type:'b' },
  { note:'G',  type:'w' },
  { note:'G#', type:'b' },
  { note:'A',  type:'w' },
  { note:'A#', type:'b' },
  { note:'B',  type:'w' },
];

let octave      = 4;
let baseOctave  = 4;
let noteCount   = 0;
let volume      = 0.7;
let currentTone = 'piano';
let audioCtx    = null;
const activeKeys = new Set();
const vizBars    = [];

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function noteFreq(note, oct) {
  const ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return 440 * Math.pow(2, (ORDER.indexOf(note) - 9 + (oct - 4) * 12) / 12);
}

function playSound(note, oct) {
  const ctx  = getCtx();
  const freq = noteFreq(note, oct);
  const now  = ctx.currentTime;
  const gain = ctx.createGain();
  const master = ctx.createGain();
  master.gain.value = volume;
  gain.connect(master);
  master.connect(ctx.destination);
  const tone = currentTone;

  if (tone === 'piano') {
    [freq, freq*2, freq*3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(i===0 ? 0.45 : 0.15/(i+1), now);
      g.gain.exponentialRampToValueAtTime(0.001, now+(i===0?2.0:1.0));
      o.connect(g); g.connect(gain);
      o.start(now); o.stop(now+2.2);
    });
  } else if (tone === 'organ') {
    [1,2,3,4].forEach((mul,i)=>{
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=freq*mul;
      const g=ctx.createGain(); const amp=[0.4,0.25,0.15,0.08][i];
      g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(amp,now+0.04);
      g.gain.setValueAtTime(amp,now+0.8); g.gain.exponentialRampToValueAtTime(0.001,now+1.4);
      o.connect(g); g.connect(gain); o.start(now); o.stop(now+1.5);
    });
  } else if (tone === 'synth') {
    const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=freq;
    const filt=ctx.createBiquadFilter(); filt.type='lowpass';
    filt.frequency.setValueAtTime(300,now);
    filt.frequency.exponentialRampToValueAtTime(freq*6,now+0.15);
    filt.frequency.exponentialRampToValueAtTime(freq*1.5,now+1.0);
    filt.Q.value=8;
    const g=ctx.createGain(); g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(0.5,now+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,now+1.2);
    o.connect(filt); filt.connect(g); g.connect(gain); o.start(now); o.stop(now+1.3);
  } else if (tone === 'bells') {
    [[1,0.5],[2.756,0.3],[5.4,0.15],[8.93,0.08]].forEach(([mul,amp])=>{
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=freq*mul;
      const g=ctx.createGain(); g.gain.setValueAtTime(amp*0.8,now);
      g.gain.exponentialRampToValueAtTime(0.001,now+2.5);
      o.connect(g); g.connect(gain); o.start(now); o.stop(now+2.7);
    });
  } else if (tone === 'bass') {
    const o=ctx.createOscillator(); o.type='square'; o.frequency.value=freq/2;
    const filt=ctx.createBiquadFilter(); filt.type='lowpass';
    filt.frequency.value=freq*2; filt.Q.value=2;
    const g=ctx.createGain(); g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(0.6,now+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,now+0.9);
    o.connect(filt); filt.connect(g); g.connect(gain); o.start(now); o.stop(now+1.0);
  } else if (tone === 'flute') {
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(freq,now);
    const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=5.5;
    const lfoG=ctx.createGain(); lfoG.gain.value=freq*0.01;
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    const g=ctx.createGain(); g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(0.4,now+0.08);
    g.gain.setValueAtTime(0.35,now+0.5);
    g.gain.exponentialRampToValueAtTime(0.001,now+1.8);
    o.connect(g); g.connect(gain); lfo.start(now); o.start(now); lfo.stop(now+2); o.stop(now+2);
  } else if (tone === 'harp') {
    [freq,freq*2,freq*3].forEach((f,i)=>{
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const g=ctx.createGain(); const amp=[0.5,0.2,0.08][i]; const decay=[1.8,1.2,0.7][i];
      g.gain.setValueAtTime(amp,now+0.001);
      g.gain.exponentialRampToValueAtTime(0.001,now+decay);
      o.connect(g); g.connect(gain); o.start(now); o.stop(now+decay+0.1);
    });
  }
}

function buildPiano() {
  const area = document.getElementById('keys-area');
  area.innerHTML = '';
  const allNotes = [];
  for (let o = octave; o <= octave+1; o++)
    OCTAVE_NOTES.forEach(n => allNotes.push({...n, oct: o}));

  const whiteOrder = allNotes.filter(n => n.type==='w');
  const blackOrder = allNotes.filter(n => n.type==='b');
  const wKeyMap = ['A','S','D','F','G','H','J','K','L',';',"'",'Z','X','C'];
  const bKeyMap = ['W','E','T','Y','U','O','P',']','8','9'];
  window._keymap = {};
  whiteOrder.forEach((n,i) => { if(wKeyMap[i]) window._keymap[wKeyMap[i]] = n; });
  blackOrder.forEach((n,i) => { if(bKeyMap[i]) window._keymap[bKeyMap[i]] = n; });

  let wi = 0;
  allNotes.forEach(n => {
    if (n.type === 'w') {
      const el = document.createElement('div');
      el.className = 'white-key';
      el.dataset.note = n.note; el.dataset.oct = n.oct;
      const kc = wKeyMap[wi] || '';
      el.innerHTML = `<span class="k-label">${kc}</span><span class="k-note">${n.note}${n.oct}</span>`;
      el.addEventListener('mousedown', e => { e.preventDefault(); fireNote(n.note, n.oct, el); });
      el.addEventListener('touchstart', e => { e.preventDefault(); fireNote(n.note, n.oct, el); }, {passive:false});
      area.appendChild(el); wi++;
    }
  });

  const KEY_W = 48; let bi=0; let cumWhite=0;
  allNotes.forEach(n => {
    if (n.type==='w') { cumWhite++; } else {
      const el = document.createElement('div');
      el.className = 'black-key';
      el.dataset.note = n.note; el.dataset.oct = n.oct;
      const kc = bKeyMap[bi] || '';
      el.innerHTML = `<span class="k-label">${kc}</span>`;
      el.style.left = (cumWhite * KEY_W - 14) + 'px';
      el.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); fireNote(n.note, n.oct, el); });
      el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fireNote(n.note, n.oct, el); }, {passive:false});
      area.appendChild(el); bi++;
    }
  });
}

function fireNote(note, oct, el) {
  noteCount++;
  document.getElementById('note-disp').textContent = note + oct;
  document.getElementById('count-disp').textContent = noteCount;
  const cd = document.getElementById('count-disp');
  cd.classList.remove('pulse'); void cd.offsetWidth; cd.classList.add('pulse');
  playSound(note, parseInt(oct));
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 220);
  ripple(el); vizPulse(note);
}

function vizPulse(note) {
  const ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const idx = ORDER.indexOf(note);
  vizBars.forEach((bar,i) => {
    const d = Math.abs(i-idx);
    bar.style.height = Math.max(3, 50-d*3.5)+'px';
    setTimeout(() => { bar.style.height='3px'; }, 380+i*15);
  });
}

function ripple(el) {
  if (!el) return;
  const r = document.createElement('div');
  r.className = 'ripple';
  const rect = el.getBoundingClientRect();
  r.style.left = (rect.left + rect.width/2) + 'px';
  r.style.top  = (rect.top  + rect.height/2) + 'px';
  r.style.width = r.style.height = rect.width + 'px';
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

// ─── KEYBOARD CONTROL ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const modal = document.getElementById('user-modal');
  if (modal && modal.style.display !== 'none') return;
  const k = e.key.toUpperCase();
  if (activeKeys.has(k)) return;
  const nd = window._keymap && window._keymap[k];
  if (nd) {
    activeKeys.add(k);
    const el = document.querySelector(`[data-note="${nd.note}"][data-oct="${nd.oct}"]`);
    fireNote(nd.note, nd.oct, el || document.createElement('div'));
  }
});
document.addEventListener('keyup', e => { activeKeys.delete(e.key.toUpperCase()); });

// ─── CONTROLS ────────────────────────────────────────────────────────────────
document.getElementById('oct-dn').addEventListener('click', () => {
  if (baseOctave > 1) { baseOctave--; octave=baseOctave; updateOctDisplay(); buildPiano(); }
});
document.getElementById('oct-up').addEventListener('click', () => {
  if (baseOctave < 6) { baseOctave++; octave=baseOctave; updateOctDisplay(); buildPiano(); }
});
function updateOctDisplay() {
  document.getElementById('oct-disp').textContent = baseOctave;
  document.getElementById('oct-num').textContent  = baseOctave;
}
document.getElementById('tone-sel').addEventListener('change', e => {
  currentTone = e.target.value;
  document.getElementById('tone-disp').textContent = e.target.options[e.target.selectedIndex].text.replace(/^.+ /,'');
});
document.getElementById('vol-slider').addEventListener('input', e => {
  volume = e.target.value / 100;
  document.getElementById('vol-disp').textContent = e.target.value;
});

// ─── VISUALIZER ───────────────────────────────────────────────────────────────
const vizWrap = document.getElementById('visualizer');
for (let i=0; i<24; i++) {
  const b = document.createElement('div');
  b.className = 'viz-bar';
  vizWrap.appendChild(b);
  vizBars.push(b);
}

// =============================================
// REGISTRATION + OTP LOGIC  (FIXED)
// =============================================

let generatedOTP   = null;
let timerInterval  = null;   // sirf EK baar declare

// ─── STEP 1: Register Button ─────────────────────────────────────────────────
async function handleRegister() {
    const name  = document.getElementById('username').value.trim();
    const email = document.getElementById('useremail').value.trim();
    const btn   = document.getElementById('send-btn');
    const msg   = document.getElementById('reg-msg');

    // Validation
    if (!name || !email) {
        msg.style.color = '#f472b6';
        msg.textContent = "Please fill in both fields!";
        return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        msg.style.color = '#f472b6';
        msg.textContent = "Please enter a valid email!";
        return;
    }

    btn.disabled    = true;
    btn.textContent = "Checking...";
    msg.textContent = "";

    try {
        // Backend se check karo repeat user hai ya nahi
        const checkRes  = await fetch('https://Bilalsaqib.pythonanywhere.com/check_email', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ email })
        });
        const checkData = await checkRes.json();

        if (checkData.is_repeat) {
            // Purana user — seedha andar
            btn.textContent = "Welcome Back! Opening...";
            showToast("🎹 Welcome Back! Piano Unlocked.");
            setTimeout(() => {
                closeModal();
                btn.disabled    = false;
                btn.textContent = "Send Verification Code";
            }, 1200);
        } else {
            // Naya user — EmailJS se OTP bhejo
            sendOtpViaEmailJS(name, email, btn, msg);
        }
    } catch (err) {
        // Backend offline hone par bhi OTP bhejo
        console.warn("Backend check failed, sending OTP anyway:", err);
        sendOtpViaEmailJS(name, email, btn, msg);
    }
}

// ─── EmailJS OTP Send ─────────────────────────────────────────────────────────
function sendOtpViaEmailJS(name, email, btn, msg) {
    btn.textContent = "Sending OTP...";
    generatedOTP    = Math.floor(100000 + Math.random() * 900000);

    emailjs.send('service_9g2xels', 'template_degjvps', {
        user_name : name,
        user_email: email,
        email: email, 
        otp_code  : generatedOTP
    })
    .then(() => {
        document.getElementById('email-display').textContent = email;
        document.getElementById('reg-step').style.display    = 'none';
        document.getElementById('otp-step').style.display    = 'block';
        startTimer(300);
    })
    .catch(err => {
        console.log(err);
        msg.style.color = '#f472b6';
        msg.textContent = "Email send failed! Check EmailJS settings.";
        btn.disabled    = false;
        btn.textContent = "Send Verification Code";
        console.error("EmailJS error:", err);
    });
}

// ─── STEP 2: Verify OTP ──────────────────────────────────────────────────────
function verifyOTP() {
    const userOTP = document.getElementById('otp-input').value.trim();
    const msg     = document.getElementById('otp-msg');

    if (!userOTP) {
        msg.style.color = '#f472b6';
        msg.textContent = "Please enter the OTP!";
        return;
    }

    // eslint-disable-next-line eqeqeq
    if (userOTP == generatedOTP) {
        if (timerInterval) clearInterval(timerInterval);
        msg.style.color = '#4ade80';
        msg.textContent = "✅ Verified!";
        showToast("🎹 Welcome! Piano Unlocked. Enjoy playing!");
        setTimeout(closeModal, 1500);
    } else {
        msg.style.color = '#f472b6';
        msg.textContent = "❌ Invalid OTP! Try again.";
    }
}

// ─── Resend OTP ──────────────────────────────────────────────────────────────
function resendOTP() {
    const email     = document.getElementById('useremail').value.trim();
    const name      = document.getElementById('username').value.trim();
    const resendBtn = document.getElementById('resend-btn');
    const msg       = document.getElementById('otp-msg');

    if (timerInterval) clearInterval(timerInterval);

    resendBtn.disabled    = true;
    resendBtn.textContent = "Sending...";
    msg.textContent       = "";

    generatedOTP = Math.floor(100000 + Math.random() * 900000);

    emailjs.send('service_9g2xels', 'template_degjvps', {
        user_name : name,
        user_email: email,
        email: email, 
        otp_code  : generatedOTP
    })
    .then(() => {
        msg.style.color       = '#38bdf8';
        msg.textContent       = "New OTP sent!";
        document.getElementById('otp-input').value = '';
        startTimer(300);
        resendBtn.textContent = "🔄 Resend OTP";
    })
    .catch(err => {
       console.log(err);
        msg.style.color       = '#f472b6';
        msg.textContent       = "Resend failed! Try again.";
        resendBtn.disabled    = false;
        resendBtn.textContent = "🔄 Resend OTP";
        console.error(err);
    });
}

// ─── Timer ───────────────────────────────────────────────────────────────────
function startTimer(totalSeconds) {
    if (timerInterval) clearInterval(timerInterval);
    const display   = document.getElementById('timer-display');
    const resendBtn = document.getElementById('resend-btn');
    resendBtn.disabled = true;
    display.style.color = '#fbbf24';
    let t = totalSeconds;

    timerInterval = setInterval(() => {
        const m = Math.floor(t/60);
        const s = t % 60;
        display.textContent = `⏳ Expires in: ${m}:${s<10?'0'+s:s}`;
        if (t <= 90) display.style.color = '#f472b6';
        if (t <= 0) {
            clearInterval(timerInterval);
            display.textContent = "❌ OTP Expired! Please resend.";
            display.style.color = '#ef4444';
            resendBtn.disabled  = false;
        }
        t--;
    }, 1000);

    // 3:30 ke baad resend enable karo
    setTimeout(() => { resendBtn.disabled = false; }, (totalSeconds-90)*1000);
}

// ─── Modal Close ─────────────────────────────────────────────────────────────
function closeModal() {
    document.getElementById('user-modal').style.display = 'none';
}

// ─── Toast Notification ──────────────────────────────────────────────────────
function showToast(message) {
    const old = document.getElementById('piano-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'piano-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed; top:30px; left:50%; transform:translateX(-50%);
        background:linear-gradient(135deg,#7c3aed,#c084fc);
        color:#fff; padding:14px 28px; border-radius:50px;
        font-size:15px; font-weight:700; z-index:9999;
        box-shadow:0 8px 32px rgba(192,132,252,0.5);
        animation:toastIn 0.4s ease; letter-spacing:0.5px;
        font-family:'Space Mono',monospace;
    `;
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes toastIn {
                from { opacity:0; transform:translateX(-50%) translateY(-20px); }
                to   { opacity:1; transform:translateX(-50%) translateY(0); }
            }`;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── Init ────────────────────────────────────────────────────────────────────
buildPiano();
