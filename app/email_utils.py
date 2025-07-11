import os
import smtplib

from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer
from aiosmtplib import send
from email.message import EmailMessage

load_dotenv()

SECRET_KEY = "super-secret-key"  # Replace with stronger one or use from env
SALT = "email-confirm-salt"
serializer = URLSafeTimedSerializer(SECRET_KEY)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")


def generate_token(email: str) -> str:
    return serializer.dumps(email, salt=SALT)
    
def verify_token(token: str, max_age: int = 3600):
    return serializer.loads(token, salt=SALT, max_age=max_age)

async def send_verification_email(email: str):
    token = generate_token(email)
    link = f"{FRONTEND_BASE_URL}/verify?token={token}"

    message = EmailMessage()
    message["From"] = EMAIL_USER
    message["To"] = email
    message["Subject"] = "Verify your CodeEval email"
    message.set_content(f"Click to verify your email: {link}")

    await send(
        message,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=EMAIL_USER,
        password=EMAIL_PASS,
        start_tls=True,
    )

def send_test_email(to_email: str):
    msg = EmailMessage()
    msg["Subject"] = "Test Email from CodeEval"
    msg["From"] = EMAIL_USER
    msg["To"] = to_email
    msg.set_content("Hello! This is a test email sent from CodeEval.")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
