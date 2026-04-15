# 🎹 Virtual Piano Studio: Secure Web-Synthesizer
### *An Advanced Interactive Web Application with Real-Time Synthesis & OTP Security*

---

## 🚀 Project Overview
A high-performance piano platform designed to bridge the gap between web-based musical instruments and secure user management. It features a sophisticated audio engine that generates tones dynamically, paired with a robust Flask-based security layer.

### 🛠 Technical Architecture
* **Audio Engine:** Built using the **Web Audio API** for latency-free, frequency-based sound generation (no MP3 samples needed).
* **Security Layer:** Implements a **Zero-Trust Access** model; the keyboard is hardware-locked until the user is verified via Gmail SMTP OTP.
* **Persistence:** Automated user logging and session tracking integrated with a **Pandas-managed Excel database**.

---

## 💎 Core Functionalities

### 1. Dynamic Sound Synthesis
Unlike standard apps, this uses mathematical oscillators to create **7 distinct instrument profiles**:
* 🎹 **Piano & Harp:** Natural decay and harmonic overtones.
* 🔊 **Synth & Bass:** Low-pass filter sweeps and square-wave modulation.
* 🔔 **Bells & Flute:** LFO (Low-Frequency Oscillation) for realistic vibrato.

### 2. Smart Verification Logic
* **First-Time Entry:** Generates a **6-digit cryptographic OTP** sent to the user's email.
* **Returning User (Bypass):** The system scans the `user_data.xlsx` database instantly. If the email is recognized, the **"Repeat Bypass"** protocol unlocks the instrument without a second OTP.

### 3. Integrated Visualizer
A **24-bar reactive spectrum visualizer** that maps piano frequencies to real-time CSS height adjustments for an immersive experience.

---

## 📂 Project Structure

| File | Role |
| :--- | :--- |
| **`main.html`** | UI Architecture & Responsive Layout |
| **`logic.js`** | Frequency Mapping & Client-Side API Handling |
| **`form_inegrate.py`** | Secure Server-Side SMTP & Data Management |
| **`design.css`** | Glassmorphism Aesthetics & Ripple Animations |

---

## ⚙️ Quick Start Guide

1. **Configure Gmail:** Update `SENDER_EMAIL` and `SENDER_PASSWORD` with a 16-digit **App Password** in the Python script.
2. **Launch Backend:** Run `python form_inegrate.py` to start the Flask server.
3. **Play:** Open `main.html` and verify your email to unlock the keyboard.

---

**Developed by:** Bilal | *Technical Researcher*
**Location:** Faisalabad, Pakistan
