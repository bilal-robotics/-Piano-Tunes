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

let octave = 4;
let noteCount = 0;
let volume = 0.7;
let currentTone = 'piano';
let audioCtx = null;
const activeKeys = new Set();
const vizBars = [];
let timerInterval = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function noteFreq(note, oct) {
  const ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const idx = ORDER.indexOf(note);
  return 440 * Math.pow(2, (idx - 9 + (oct - 4) * 12) / 12);
}

function playSound(note, oct) {
  const ctx = getCtx();
  const freq = noteFreq(note, oct);
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  const master = ctx.createGain();
  master.gain.value = volume;
  gain.connect(master);
  master.connect(ctx.destination);

  const tone = currentTone;

  if (tone === 'piano') {
    [freq, freq * 2, freq * 3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(i === 0 ? 0.45 : 0.15 / (i+1), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + (i === 0 ? 2.0 : 1.0));
      o.connect(g); g.connect(gain);
      o.start(now); o.stop(now + 2.2);
    });
  } else if (tone === 'organ') {
    [1, 2, 3, 4].forEach((mul, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mul;
      const g = ctx.createGain();
      const amp = [0.4, 0.25, 0.15, 0.08][i];
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.04);
      g.gain.setValueAtTime(amp, now + 0.8);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      o.connect(g); g.connect(gain);
      o.start(now); o.stop(now + 1.5);
    });
  } else if (tone === 'synth') {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(300, now);
    filt.frequency.exponentialRampToValueAtTime(freq * 6, now + 0.15);
    filt.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.0);
    filt.Q.value = 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    o.connect(filt); filt.connect(g); g.connect(gain);
    o.start(now); o.stop(now + 1.3);
  } else if (tone === 'bells') {
    [[1, 0.5], [2.756, 0.3], [5.4, 0.15], [8.93, 0.08]].forEach(([mul, amp]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime(amp * 0.8, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      o.connect(g); g.connect(gain);
      o.start(now); o.stop(now + 2.7);
    });
  } else if (tone === 'bass') {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq / 2;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = freq * 2;
    filt.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.6, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    o.connect(filt); filt.connect(g); g.connect(gain);
    o.start(now); o.stop(now + 1.0);
  } else if (tone === 'flute') {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, now);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = freq * 0.01;
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.4, now + 0.08);
    g.gain.setValueAtTime(0.35, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    o.connect(g); g.connect(gain);
    lfo.start(now); o.start(now);
    lfo.stop(now + 2); o.stop(now + 2);
  } else if (tone === 'harp') {
    [freq, freq * 2, freq * 3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      const amp = [0.5, 0.2, 0.08][i];
      const decay = [1.8, 1.2, 0.7][i];
      g.gain.setValueAtTime(amp, now + 0.001);
      g.gain.exponentialRampToValueAtTime(0.001, now + decay);
      o.connect(g); g.connect(gain);
      o.start(now); o.stop(now + decay + 0.1);
    });
  }
}

function buildPiano() {
  const area = document.getElementById('keys-area');
  area.innerHTML = '';
  const allNotes = [];
  for (let o = octave; o <= octave + 1; o++) {
    OCTAVE_NOTES.forEach(n => allNotes.push({ ...n, oct: o }));
  }
  const whiteOrder = allNotes.filter(n => n.type === 'w');
  const blackOrder = allNotes.filter(n => n.type === 'b');
  const wKeyMap = ['A','S','D','F','G','H','J','K','L',';','\'','Z','X','C'];
  const bKeyMap = ['W','E','T','Y','U','O','P',']','8','9'];
  window._keymap = {};
  whiteOrder.forEach((n, i) => { if (wKeyMap[i]) window._keymap[wKeyMap[i]] = n; });
  blackOrder.forEach((n, i) => { if (bKeyMap[i]) window._keymap[bKeyMap[i]] = n; });

  let wi = 0;
  allNotes.forEach(n => {
    if (n.type === 'w') {
      const el = document.createElement('div');
      el.className = 'white-key';
      el.dataset.note = n.note;
      el.dataset.oct = n.oct;
      const kc = wKeyMap[wi] || '';
      el.innerHTML = `<span class="k-label">${kc}</span><span class="k-note">${n.note}${n.oct}</span>`;
      el.addEventListener('mousedown', e => { e.preventDefault(); fireNote(n.note, n.oct, el); });
      area.appendChild(el);
      wi++;
    }
  });

  const KEY_W = 48;
  let bi = 0;
  let cumWhite = 0;
  allNotes.forEach((n, idx) => {
    if (n.type === 'w') { cumWhite++; } else {
      const el = document.createElement('div');
      el.className = 'black-key';
      el.dataset.note = n.note;
      el.dataset.oct = n.oct;
      const kc = bKeyMap[bi] || '';
      el.innerHTML = `<span class="k-label">${kc}</span>`;
      el.style.left = (cumWhite * KEY_W - 14) + 'px';
      el.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); fireNote(n.note, n.oct, el); });
      area.appendChild(el);
      bi++;
    }
  });
}

function fireNote(note, oct, el) {
  noteCount++;
  document.getElementById('note-disp').textContent = note + oct;
  document.getElementById('count-disp').textContent = noteCount;
  const cd = document.getElementById('count-disp');
  cd.classList.remove('pulse');
  void cd.offsetWidth;
  cd.classList.add('pulse');
  playSound(note, parseInt(oct));
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 220);
  ripple(el);
  vizPulse(note);
}

function vizPulse(note) {
  const ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const idx = ORDER.indexOf(note);
  vizBars.forEach((bar, i) => {
    const d = Math.abs(i - idx);
    const h = Math.max(3, 50 - d * 3.5);
    bar.style.height = h + 'px';
    setTimeout(() => { bar.style.height = '3px'; }, 380 + i * 15);
  });
}

function ripple(el) {
  if (!el) return;
  const r = document.createElement('div');
  r.className = 'ripple';
  const rect = el.getBoundingClientRect();
  r.style.left = (rect.left + rect.width / 2) + 'px';
  r.style.top = (rect.top + rect.height / 2) + 'px';
  r.style.width = r.style.height = rect.width + 'px';
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

document.addEventListener('keydown', e => {
  // --- NAYI CONDITION ---
  const modal = document.getElementById('user-modal');
  
  // Agar modal ka display 'none' nahi hai, iska matlab form khula hai
  // To yahan se 'return' ho jao taake piano ki keys kaam na karein
  if (modal && modal.style.display !== 'none') {
    return; 
  }
  // ----------------------

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

let baseOctave = 4;
document.getElementById('oct-dn').addEventListener('click', () => {
  if (baseOctave > 1) { baseOctave--; octave = baseOctave; updateOctDisplay(); buildPiano(); }
});
document.getElementById('oct-up').addEventListener('click', () => {
  if (baseOctave < 6) { baseOctave++; octave = baseOctave; updateOctDisplay(); buildPiano(); }
});
function updateOctDisplay() {
  document.getElementById('oct-disp').textContent = baseOctave;
  document.getElementById('oct-num').textContent = baseOctave;
}

document.getElementById('tone-sel').addEventListener('change', e => {
  currentTone = e.target.value;
  document.getElementById('tone-disp').textContent = e.target.options[e.target.selectedIndex].text.replace(/^.+ /, '');
});

document.getElementById('vol-slider').addEventListener('input', e => {
  volume = e.target.value / 100;
  document.getElementById('vol-disp').textContent = e.target.value;
});

const vizWrap = document.getElementById('visualizer');
for (let i = 0; i < 24; i++) {
  const b = document.createElement('div');
  b.className = 'viz-bar';
  vizWrap.appendChild(b);
  vizBars.push(b);
}

// =============================================
// REGISTRATION + OTP LOGIC
// =============================================

// Har refresh par form show hoga (no localStorage)
// Backend se check hoga repeat user ya nahi

async function handleRegister() {
    const name = document.getElementById('username').value.trim();
    const email = document.getElementById('useremail').value.trim();
    const btn = document.getElementById('send-btn');
    const msg = document.getElementById('reg-msg');

    if (!name || !email) {
        msg.textContent = "Please fill in both fields!";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Checking...";
    msg.textContent = "";

    try {
        // Pehle check karo ke email repeat hai ya nahi
        const checkRes = await fetch('http://127.0.0.1:5000/check_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const checkData = await checkRes.json();

        if (checkData.is_repeat) {
            // Repeat user - seedha entry karo aur game kholo
            btn.textContent = "Opening Piano...";
            const verifyRes = await fetch('http://127.0.0.1:5000/verify_otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, otp: 'REPEAT_BYPASS' })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === "success" || verifyData.status === "repeat") {
                closeModal();
            } else {
                msg.textContent = "Error: " + verifyData.message;
                btn.disabled = false;
                btn.textContent = "Send Verification Code";
            }
        } else {
            // Naya user - OTP bhejo
            btn.textContent = "Sending OTP...";
            const otpRes = await fetch('http://127.0.0.1:5000/send_otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const otpData = await otpRes.json();

            if (otpData.status === "success") {
                document.getElementById('email-display').textContent = email;
                document.getElementById('reg-step').style.display = 'none';
                document.getElementById('otp-step').style.display = 'block';
                startTimer(300); // 5 minutes
            } else {
                msg.textContent = "Error: " + otpData.message;
                btn.disabled = false;
                btn.textContent = "Send Verification Code";
            }
        }
    } catch (err) {
        msg.textContent = "Backend not connected! Run Python script first.";
        btn.disabled = false;
        btn.textContent = "Send Verification Code";
        console.error(err);
    }
}

async function resendOTP() {
    const email = document.getElementById('useremail').value.trim();
    const resendBtn = document.getElementById('resend-btn');
    const msg = document.getElementById('otp-msg');

    resendBtn.disabled = true;
    resendBtn.textContent = "Sending...";
    msg.textContent = "";

    // Purana timer band karo
    if (timerInterval) clearInterval(timerInterval);

    try {
        const res = await fetch('http://127.0.0.1:5000/send_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await res.json();

        if (data.status === "success") {
            msg.style.color = '#38bdf8';
            msg.textContent = "New OTP sent!";
            document.getElementById('otp-input').value = '';
            startTimer(300); // Reset to 5 min
        } else {
            msg.style.color = '#f472b6';
            msg.textContent = "Error: " + data.message;
        }
    } catch (err) {
        msg.style.color = '#f472b6';
        msg.textContent = "Backend error!";
    }

    resendBtn.disabled = false;
    resendBtn.textContent = "🔄 Resend OTP";
}

async function verifyOTP() {
    const payload = {
        name: document.getElementById('username').value.trim(),
        email: document.getElementById('useremail').value.trim(),
        otp: document.getElementById('otp-input').value.trim()
    };
    const msg = document.getElementById('otp-msg');

    if (!payload.otp) {
        msg.textContent = "Please enter the OTP!";
        return;
    }

    msg.style.color = '#fbbf24';
    msg.textContent = "Verifying...";

    try {
        const res = await fetch('http://127.0.0.1:5000/verify_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.status === "success") {
            if (timerInterval) clearInterval(timerInterval);
            closeModal();
        } else {
            msg.style.color = '#f472b6';
            msg.textContent = data.message;
        }
    } catch (err) {
        msg.style.color = '#f472b6';
        msg.textContent = "Backend error!";
    }
}

function closeModal() {
    document.getElementById('user-modal').style.display = 'none';
}

function startTimer(totalSeconds) {
    if (timerInterval) clearInterval(timerInterval);
    const display = document.getElementById('timer-display');
    const resendBtn = document.getElementById('resend-btn');
    
    // Timer ke dauran resend disable raho
    resendBtn.disabled = true;

    let t = totalSeconds;

    timerInterval = setInterval(() => {
        let m = Math.floor(t / 60);
        let s = t % 60;
        display.textContent = `⏳ Expires in: ${m}:${s < 10 ? '0' + s : s}`;

        // 1:30 (90 seconds) par color change
        if (t <= 90) {
            display.style.color = '#f472b6';
        }

        if (t <= 0) {
            clearInterval(timerInterval);
            display.textContent = "❌ OTP Expired! Please resend.";
            display.style.color = '#ef4444';
            resendBtn.disabled = false; // Ab resend ka option do
        }
        t--;
    }, 1000);

    // 5 min baad resend enable ho jaye (timer ke khatam hone par)
    // Lekin user 1:30 ke baad dekh sakta hai ke OTP nahi aaya
    setTimeout(() => {
        resendBtn.disabled = false;
    }, (totalSeconds - 90) * 1000); // 3:30 ke baad resend enable
}

buildPiano();