import smtplib
import random
import time
import os
import json
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from email.mime.text import MIMEText

app = Flask(__name__)

# ─── CORS FIX: Sab origins allow karo (PythonAnywhere ke liye zaroori) ───
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

# ─── CONFIGURATION ────────────────────────────────────────────────────────
EXCEL_FILE      = 'user_data.xlsx'
OTP_FILE        = 'otp_storage.json'   # File-based OTP (server restart safe)
SENDER_EMAIL    = "bilalsaqib7153@gmail.com"
SENDER_PASSWORD = "xcaa sgcs udnr upew"


# ─── CORS PREFLIGHT: OPTIONS request ka jawab do ─────────────────────────
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin']  = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

@app.route('/check_email', methods=['OPTIONS'])
@app.route('/send_otp',    methods=['OPTIONS'])
@app.route('/verify_otp',  methods=['OPTIONS'])
def handle_options():
    return jsonify({}), 200


# ─── HELPER: File-based OTP load/save ─────────────────────────────────────
def load_otp_storage():
    if os.path.exists(OTP_FILE):
        try:
            with open(OTP_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_otp_storage(data):
    with open(OTP_FILE, 'w') as f:
        json.dump(data, f)


# ─── HELPER: Excel Load ───────────────────────────────────────────────────
def load_df():
    if os.path.exists(EXCEL_FILE):
        return pd.read_excel(EXCEL_FILE)
    return pd.DataFrame(columns=['Name', 'Email', 'Date_Time'])


# ─── ROUTE 1: Check Email ─────────────────────────────────────────────────
@app.route('/check_email', methods=['POST'])
def check_email():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({"status": "error", "message": "Email required!"})

    df        = load_df()
    is_repeat = email in df['Email'].str.lower().values

    return jsonify({"status": "success", "is_repeat": bool(is_repeat)})


# ─── ROUTE 2: Send OTP ───────────────────────────────────────────────────
@app.route('/send_otp', methods=['POST'])
def send_otp():
    data  = request.json or {}
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
        msg['Subject'] = 'Piano Tunes - Verification Code'
        msg['From']    = SENDER_EMAIL
        msg['To']      = email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, msg.as_string())

        otp_storage = load_otp_storage()
        otp_storage[email.lower()] = {'otp': otp, 'time': time.time()}
        save_otp_storage(otp_storage)

        print(f"[OTP] Sent to {email}: {otp}")
        return jsonify({"status": "success", "message": "OTP sent successfully!"})

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"status": "error", "message": str(e)})


# ─── ROUTE 3: Verify OTP ─────────────────────────────────────────────────
@app.route('/verify_otp', methods=['POST'])
def verify_otp():
    data      = request.json or {}
    name      = data.get('name', '').strip()
    email     = data.get('email', '').strip()
    user_otp  = data.get('otp', '').strip()
    email_key = email.lower()
    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

    df        = load_df()
    is_repeat = email_key in df['Email'].str.lower().values

    # ── Repeat user bypass ───────────────────────────────────────────────
    if user_otp == 'REPEAT_BYPASS':
        if not is_repeat:
            return jsonify({"status": "error", "message": "Not a repeat user!"})

        new_row = {'Name': 'Repeat', 'Email': email, 'Date_Time': timestamp}
        df = pd.concat([pd.DataFrame([new_row]), df], ignore_index=True)
        df.to_excel(EXCEL_FILE, index=False)

        return jsonify({"status": "success", "message": "Welcome back! Piano Unlocked."})

    # ── Normal OTP verify ────────────────────────────────────────────────
    otp_storage = load_otp_storage()

    if email_key not in otp_storage:
        return jsonify({"status": "error", "message": "Please request OTP first!"})

    stored_data = otp_storage[email_key]

    # Expiry check (5 minutes)
    if time.time() - stored_data['time'] > 300:
        del otp_storage[email_key]
        save_otp_storage(otp_storage)
        return jsonify({"status": "error", "message": "OTP Expired! Please resend."})

    # OTP match
    if user_otp != stored_data['otp']:
        return jsonify({"status": "error", "message": "Incorrect OTP! Try again."})

    # ── Save to Excel ────────────────────────────────────────────────────
    name_to_save = 'Repeat' if is_repeat else name
    new_row = {'Name': name_to_save, 'Email': email, 'Date_Time': timestamp}
    df = pd.concat([pd.DataFrame([new_row]), df], ignore_index=True)
    df.to_excel(EXCEL_FILE, index=False)

    del otp_storage[email_key]
    save_otp_storage(otp_storage)

    print(f"[VERIFIED] {email} → saved as '{name_to_save}'")
    return jsonify({"status": "success", "message": "Verified! Welcome to Piano Tunes."})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
