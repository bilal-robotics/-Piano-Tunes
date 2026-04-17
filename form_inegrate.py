import smtplib
import random
import time
import os
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
EXCEL_FILE = 'user_data.xlsx'
SENDER_EMAIL = "pianogameapp00@gmail.com"
SENDER_PASSWORD = "tmmp wxxj vzdq aamn"  # Yahan apna Gmail App Password likhein

# OTP ko temporary save karne ke liye
otp_storage = {}


# ─── HELPER: Excel Load/Save ────────────────────────────────────────────
def load_df():
    if os.path.exists(EXCEL_FILE):
        return pd.read_excel(EXCEL_FILE)
    return pd.DataFrame(columns=['Name', 'Email', 'Date_Time'])


# ─── ROUTE 1: Check Email (Repeat ya Naya?) ─────────────────────────────
@app.route('/check_email', methods=['POST'])
def check_email():
    data = request.json
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({"status": "error", "message": "Email required!"})

    df = load_df()
    # Case-insensitive check
    is_repeat = email in df['Email'].str.lower().values

    return jsonify({"status": "success", "is_repeat": bool(is_repeat)})


# ─── ROUTE 2: Send OTP ──────────────────────────────────────────────────
@app.route('/send_otp', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get('email', '').strip()

    if not email:
        return jsonify({"status": "error", "message": "Email is required!"})

    otp = str(random.randint(100000, 999999))

    try:
        msg = MIMEText(
            f"Your Piano Tunes Verification Code is: {otp}\n\n"
            f"This code will expire in 5 minutes.\n\n"
            f"— Piano Tunes by Bilal"
        )
        msg['Subject'] = '🎹 Piano Tunes - Verification Code'
        msg['From'] = SENDER_EMAIL
        msg['To'] = email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, msg.as_string())

        # OTP save karo timestamp ke saath
        otp_storage[email.lower()] = {'otp': otp, 'time': time.time()}
        print(f"[OTP] Sent to {email}: {otp}")

        return jsonify({"status": "success", "message": "OTP sent successfully!"})

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"status": "error", "message": str(e)})


# ─── ROUTE 3: Verify OTP ────────────────────────────────────────────────
@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    data = request.json
    name      = data.get('name', '').strip()
    email     = data.get('email', '').strip()
    user_otp  = data.get('otp', '').strip()
    email_key = email.lower()
    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    df = load_df()
    is_repeat = email_key in df['Email'].str.lower().values

    # ── Repeat user bypass ──────────────────────────────────────────────
    if user_otp == 'REPEAT_BYPASS':
        if not is_repeat:
            return jsonify({"status": "error", "message": "Not a repeat user!"})

        # Excel mein dobara "Repeat" entry daal do
        new_row = {'Name': 'Repeat', 'Email': email, 'Date_Time': timestamp}
        df = pd.concat([pd.DataFrame([new_row]), df], ignore_index=True)
        df.to_excel(EXCEL_FILE, index=False)

        return jsonify({"status": "success", "message": "Welcome back! Piano Unlocked."})

    # ── Normal OTP verify ───────────────────────────────────────────────
    if email_key not in otp_storage:
        return jsonify({"status": "error", "message": "Please request OTP first!"})

    stored_data = otp_storage[email_key]

    # Expiry check (300 seconds = 5 minutes)
    if time.time() - stored_data['time'] > 300:
        del otp_storage[email_key]
        return jsonify({"status": "error", "message": "OTP Expired! Please resend."})

    # OTP match check
    if user_otp != stored_data['otp']:
        return jsonify({"status": "error", "message": "Incorrect OTP! Try again."})

    # ── Sahi OTP — Excel mein save karo ────────────────────────────────
    name_to_save = 'Repeat' if is_repeat else name
    new_row = {'Name': name_to_save, 'Email': email, 'Date_Time': timestamp}
    df = pd.concat([pd.DataFrame([new_row]), df], ignore_index=True)
    df.to_excel(EXCEL_FILE, index=False)

    del otp_storage[email_key]
    print(f"[VERIFIED] {email} → saved as '{name_to_save}'")

    return jsonify({"status": "success", "message": "Verified! Welcome to Piano Tunes."})


# ─── ROUTE 4: Direct Save (Frontend ne OTP verify kar liya) ────────────────
@app.route('/save_user', methods=['POST'])
def save_user():
    data      = request.json
    name      = data.get('name', '').strip()
    email     = data.get('email', '').strip()
    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    if not name or not email:
        return jsonify({"status": "error", "message": "Name and email required!"})

    df        = load_df()
    is_repeat = email.lower() in df['Email'].str.lower().values

    # Agar pehle se exist karta hai toh dobara save mat karo
    if is_repeat:
        print(f"[SKIPPED] {email} already exists — not saving again")
        return jsonify({"status": "success", "message": "Already registered!"})

    # Sirf naya user save karo
    new_row = {'Name': name, 'Email': email, 'Date_Time': timestamp}
    df = pd.concat([pd.DataFrame([new_row]), df], ignore_index=True)
    df.to_excel(EXCEL_FILE, index=False)

    print(f"[SAVED] New user: {email}")
    return jsonify({"status": "success", "message": f"Saved as {name}!"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
