from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

from app.core.config import settings


async def send_verification_email(to_email: str, verification_link: str) -> None:
    """Fired from a BackgroundTask after signup has already committed, so a dead
    SMTP server can't roll back account creation -- worst case the user asks for
    the link again."""

    if not settings.SMTP_HOST:
        # No mail server configured (local dev / CI / tests) -- skip rather than
        # crash a background task nobody is watching for a result.
        return

    conf = ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER or "",
        MAIL_PASSWORD=settings.SMTP_PASSWORD or "",
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=bool(settings.SMTP_USER),
        VALIDATE_CERTS=True,
    )
    message = MessageSchema(
        subject="Verify your HRMS account",
        recipients=[to_email],
        body=(
            "<h2>Welcome to HRMS</h2>"
            "<p>Click the link below to verify your email address:</p>"
            f'<p><a href="{verification_link}">{verification_link}</a></p>'
        ),
        subtype="html",
    )
    await FastMail(conf).send_message(message)
