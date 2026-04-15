#🎹 Piano Tunes
A high-performance, web-based interactive Piano application featuring real-time sound synthesis, custom keyboard mapping, and a secure OTP (One-Time Password) verification system.

🌟 Key Features
Advanced Audio Synthesis: Utilizes the Web Audio API to generate high-fidelity tones including Piano, Organ, Synth, Bells, Bass, Flute, and Harp without external audio files.

Interactive UI: Supports both mouse clicks and physical keyboard input for a seamless playing experience.

Secure Registration: Includes a built-in Flask backend to verify users via email OTP before granting access to the instrument.

Returning User Recognition: Automatically identifies previously registered emails in the database to bypass the OTP step for a faster experience.

Dynamic Visuals: Features real-time visualizer bars and ripple effects that react to every note played.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Modern UI with Glassmorphism), JavaScript (ES6+).

Backend: Python (Flask), Flask-CORS for cross-origin resource sharing.

Data Management: Excel (.xlsx) integration using the pandas library for user logging.

Email Engine: SMTP integration with Gmail App Passwords for secure verification delivery.

📋 System Architecture (How it Works)
Input Blocking: Upon loading, a modal overlay covers the screen and a JavaScript condition blocks all keyboard piano events until the user is verified.

Verification Flow:

Step A: User enters their name and email.

Step B: The frontend sends a request to the /check_email route. If the email exists in the Excel database, the system triggers a REPEAT_BYPASS and unlocks the game instantly.

Step C: For new users, a 6-digit OTP is generated and sent via Gmail SMTP. Once verified through the /verify_otp route, the modal closes.

Keyboard Mapping: Once unlocked, keys like A, S, D, F... (white keys) and W, E, T, Y... (black keys) are mapped to specific frequencies.

Data Logging: Every successful login or registration is timestamped and saved into user_data.xlsx for administrative records.

📁 Project Structure
main.html: The core user interface and modal registration form.

logic.js: The "brain" of the project, handling audio context, keyboard listeners, and API calls.

form_inegrate.py: The Python Flask server managing security and data storage.

design.css: Custom styling for the piano body, keys, and responsive layout.

🔧 Installation
Clone this repository.

Install dependencies: pip install flask flask-cors pandas openpyxl.

Configure your Gmail and App Password in form_inegrate.py.

Run the backend: python form_inegrate.py.

Open main.html in any modern web browser.

Developed by: Bilal
Focus: Robotics & Embedded Systems Research
