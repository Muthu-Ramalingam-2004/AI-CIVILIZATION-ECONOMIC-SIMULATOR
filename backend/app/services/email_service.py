import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_reset_password_email(email: str, token: str) -> bool:
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    # Professional HTML email layout
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your Password - AI Civilization Economic Simulator</title>
        <style>
            body {{
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                color: #0f172a;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #7c3aed, #0891b2);
                padding: 30px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 0;
                font-size: 22px;
                font-weight: 800;
                letter-spacing: 0.05em;
            }}
            .header p {{
                margin: 5px 0 0 0;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                opacity: 0.9;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
            }}
            .content p {{
                margin: 0 0 20px 0;
                font-size: 15px;
            }}
            .btn-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .btn {{
                background-color: #2563eb;
                color: #ffffff !important;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                padding: 12px 24px;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
            }}
            .footer {{
                background-color: #f1f5f9;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
            }}
            .expiry-note {{
                font-size: 13px;
                color: #94a3b8;
                font-style: italic;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AI CIVILIZATION</h1>
                <p>Economic Simulator Platform</p>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset your password for your account on the AI Civilization Economic Simulator platform.</p>
                <p>Click the button below to choose a new password. This reset link is secure and will expire in <strong>15 minutes</strong>.</p>
                <div class="btn-container">
                    <a href="{reset_link}" class="btn" style="color: #ffffff; background-color: #2563eb; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p class="expiry-note">If you did not request a password reset, please ignore this email; your account will remain secure.</p>
            </div>
            <div class="footer">
                &copy; 2026 AI Civilization Economic Simulator Platform
            </div>
        </div>
    </body>
    </html>
    """

    print("=" * 60)
    print(f"[PASSWORD RESET LINK GENERATED FOR {email}]")
    print(f"Link: {reset_link}")
    print("=" * 60)

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print("[SMTP Log] SMTP credentials are not set in .env. Skipping real email delivery.")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Reset Your Password - AI Civilization Economic Simulator"
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = email

        msg.attach(MIMEText(html_content, 'html'))

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())
        server.quit()
        print(f"[SMTP Log] Reset email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"[SMTP Error] Failed to send password reset email: {e}")
        return False
