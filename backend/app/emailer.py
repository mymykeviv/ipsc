import smtplib
from email.message import EmailMessage
from .config import settings


def send_email(to: str, subject: str, body: str):
    if not settings.smtp_enabled:
        return False
    msg = EmailMessage()
    msg['From'] = settings.smtp_from
    msg['To'] = to
    msg['Subject'] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
        if settings.smtp_user and settings.smtp_password:
            s.login(settings.smtp_user, settings.smtp_password)
        s.send_message(msg)
    return True

