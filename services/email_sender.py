import os
import smtplib
import mimetypes
from email.message import EmailMessage

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo-dark.png")


def _get_config():
    """Load SMTP host, port, user, password, and from-address from env."""
    return {
        "host": os.environ.get("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER", ""),
        "password": os.environ.get("SMTP_PASS", ""),
        "from_addr": os.environ.get("SMTP_FROM") or os.environ.get("SMTP_USER", ""),
    }


def _build_html_en(file_kind_en: str, project_name: str) -> str:
    """Return the English HTML body. Same branding and layout as the Arabic
    template but LTR. The logo is referenced by cid:logo which is attached
    inline by send_file_via_email."""
    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <style type="text/css">
    :root {{ color-scheme: light only !important; supported-color-schemes: light only !important; }}
    body, table, td {{ color-scheme: light only !important; }}
    @media (prefers-color-scheme: dark) {{
      .email-bg {{ background-color: #f4f6f5 !important; }}
      .header-bg {{ background-color: #FFF9F0 !important; }}
      .body-bg {{ background-color: #ffffff !important; }}
      .footer-bg {{ background-color: #f9fafb !important; }}
      .text-dark {{ color: #08312D !important; }}
      .text-gray {{ color: #374151 !important; }}
      .text-light {{ color: #6b7280 !important; }}
      .text-gold {{ color: #C6A75E !important; }}
    }}
    [data-ogsc] .email-bg {{ background-color: #f4f6f5 !important; }}
    [data-ogsc] .header-bg {{ background-color: #FFF9F0 !important; }}
    [data-ogsc] .body-bg {{ background-color: #ffffff !important; }}
    [data-ogsc] .text-dark {{ color: #08312D !important; }}
  </style>
</head>
<body class="email-bg" bgcolor="#f4f6f5" style="margin:0 !important;padding:0 !important;background:#f4f6f5 !important;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#08312D !important">
  <div class="email-bg" style="background-color:#f4f6f5 !important;padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f5" style="background-color:#f4f6f5 !important">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff !important;border-radius:14px;overflow:hidden">

          <tr><td class="header-bg" bgcolor="#FFF9F0" style="background-color:#FFF9F0 !important;padding:40px 24px 32px;text-align:center;border-bottom:3px solid #C6A75E">
            <img src="cid:logo" alt="Muqaddim" width="80" style="display:block;margin:0 auto 14px;border:0;outline:none;text-decoration:none">
            <h1 class="text-dark" style="color:#08312D !important;font-size:24px;margin:0;font-weight:700">Muqaddim Platform</h1>
            <p class="text-gold" style="color:#C6A75E !important;font-size:14px;margin:6px 0 0;font-weight:600">Smart Feasibility Studies for Your Projects</p>
          </td></tr>

          <tr><td class="body-bg" bgcolor="#ffffff" style="background-color:#ffffff !important;padding:36px 32px">
            <h2 class="text-dark" style="font-size:20px;margin:0 0 16px;color:#08312D !important">Hello 👋</h2>
            <p class="text-gray" style="font-size:15px;line-height:1.9;margin:0 0 18px;color:#374151 !important">
              Attached is your <strong class="text-dark" style="color:#08312D !important">{file_kind_en}</strong> for the project
              <strong class="text-gold" style="color:#C6A75E !important">"{project_name}"</strong>.
            </p>
            <p class="text-gray" style="font-size:15px;line-height:1.9;margin:0 0 24px;color:#374151 !important">
              The file contains a comprehensive analysis and professional insights to help you make decisions and present your project with confidence.
            </p>

            <p class="text-light" style="font-size:14px;line-height:1.8;color:#6b7280 !important;margin:24px 0 0">
              Wishing you success on your journey ✨
            </p>
          </td></tr>

          <tr><td class="footer-bg" bgcolor="#f9fafb" style="background-color:#f9fafb !important;padding:22px 32px;border-top:1px solid #e5e7eb;text-align:center">
            <p class="text-light" style="font-size:12px;color:#6b7280 !important;margin:0 0 6px">
              This email was sent automatically by Muqaddim Platform
            </p>
            <p style="font-size:12px;color:#9ca3af !important;margin:0">
              © 2026 Muqaddim · All rights reserved
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </div>
</body>
</html>"""


def _build_html(file_kind_ar: str, project_name: str) -> str:
    """Return the Arabic HTML body with RTL layout and the Muqaddim brand."""
    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="rtl" lang="ar" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <style type="text/css">
    :root {{ color-scheme: light only !important; supported-color-schemes: light only !important; }}
    body, table, td {{ color-scheme: light only !important; }}
    @media (prefers-color-scheme: dark) {{
      .email-bg {{ background-color: #f4f6f5 !important; }}
      .header-bg {{ background-color: #FFF9F0 !important; }}
      .body-bg {{ background-color: #ffffff !important; }}
      .footer-bg {{ background-color: #f9fafb !important; }}
      .text-dark {{ color: #08312D !important; }}
      .text-gray {{ color: #374151 !important; }}
      .text-light {{ color: #6b7280 !important; }}
      .text-gold {{ color: #C6A75E !important; }}
    }}
    [data-ogsc] .email-bg {{ background-color: #f4f6f5 !important; }}
    [data-ogsc] .header-bg {{ background-color: #FFF9F0 !important; }}
    [data-ogsc] .body-bg {{ background-color: #ffffff !important; }}
    [data-ogsc] .text-dark {{ color: #08312D !important; }}
  </style>
</head>
<body class="email-bg" bgcolor="#f4f6f5" style="margin:0 !important;padding:0 !important;background:#f4f6f5 !important;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#08312D !important">
  <div class="email-bg" style="background-color:#f4f6f5 !important;padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f5" style="background-color:#f4f6f5 !important">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff !important;border-radius:14px;overflow:hidden">

          <tr><td class="header-bg" bgcolor="#FFF9F0" style="background-color:#FFF9F0 !important;padding:40px 24px 32px;text-align:center;border-bottom:3px solid #C6A75E">
            <img src="cid:logo" alt="مُقدِّم" width="80" style="display:block;margin:0 auto 14px;border:0;outline:none;text-decoration:none">
            <h1 class="text-dark" style="color:#08312D !important;font-size:24px;margin:0;font-weight:700">منصة مُقدِّم</h1>
            <p class="text-gold" style="color:#C6A75E !important;font-size:14px;margin:6px 0 0;font-weight:600">دراسة الجدوى الذكية لمشاريعك</p>
          </td></tr>

          <tr><td class="body-bg" bgcolor="#ffffff" style="background-color:#ffffff !important;padding:36px 32px">
            <h2 class="text-dark" style="font-size:20px;margin:0 0 16px;color:#08312D !important">مرحباً 👋</h2>
            <p class="text-gray" style="font-size:15px;line-height:1.9;margin:0 0 18px;color:#374151 !important">
              مرفق لك <strong class="text-dark" style="color:#08312D !important">{file_kind_ar}</strong> الخاص بمشروع
              <strong class="text-gold" style="color:#C6A75E !important">"{project_name}"</strong>.
            </p>
            <p class="text-gray" style="font-size:15px;line-height:1.9;margin:0 0 24px;color:#374151 !important">
              يحتوي الملف على تحليل شامل ومعلومات احترافية تساعدك في اتخاذ القرار وعرض مشروعك بثقة.
            </p>

            <p class="text-light" style="font-size:14px;line-height:1.8;color:#6b7280 !important;margin:24px 0 0">
              نتمنى لك التوفيق في رحلتك ✨
            </p>
          </td></tr>

          <tr><td class="footer-bg" bgcolor="#f9fafb" style="background-color:#f9fafb !important;padding:22px 32px;border-top:1px solid #e5e7eb;text-align:center">
            <p class="text-light" style="font-size:12px;color:#6b7280 !important;margin:0 0 6px">
              هذا الإيميل أُرسل تلقائياً من منصة مُقدِّم
            </p>
            <p style="font-size:12px;color:#9ca3af !important;margin:0">
              © 2026 Muqaddim · جميع الحقوق محفوظة
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </div>
</body>
</html>"""


def send_file_via_email(to_email: str, subject: str, body: str, file_path: str, attachment_name: str,
                         project_name: str = "", file_kind_ar: str = "الملف",
                         file_kind_en: str = "File", language: str = "ar"):
    """Build and send a branded multipart email with an attached file.

    body is the plain-text alternative for mail clients that cannot render
    HTML. project_name appears inside the template. file_kind_ar /
    file_kind_en are the displayed file kind label in each language. The
    language parameter selects which HTML template is rendered.

    Raises:
        EnvironmentError: SMTP_USER / SMTP_PASS missing in .env.
        FileNotFoundError: the attachment path does not exist.
        RuntimeError: the SMTP server rejected the message.
    """
    cfg = _get_config()
    if not cfg["user"] or not cfg["password"]:
        raise EnvironmentError("SMTP_USER and SMTP_PASS must be set in .env")

    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = cfg["from_addr"]
    msg["To"]      = to_email
    msg.set_content(body)

    if language == "en":
        html = _build_html_en(file_kind_en, project_name or "Your Project")
    else:
        html = _build_html(file_kind_ar, project_name or "مشروعك")
    msg.add_alternative(html, subtype="html")

    if os.path.isfile(LOGO_PATH):
        with open(LOGO_PATH, "rb") as f:
            msg.get_payload()[1].add_related(
                f.read(),
                maintype="image",
                subtype="png",
                cid="<logo>",
            )

    ctype, encoding = mimetypes.guess_type(file_path)
    if ctype is None or encoding is not None:
        ctype = "application/octet-stream"
    maintype, subtype = ctype.split("/", 1)

    with open(file_path, "rb") as f:
        msg.add_attachment(f.read(), maintype=maintype, subtype=subtype, filename=attachment_name)

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=30) as smtp:
            smtp.starttls()
            smtp.login(cfg["user"], cfg["password"])
            smtp.send_message(msg)
    except smtplib.SMTPException as e:
        raise RuntimeError(f"فشل إرسال الإيميل: {e}") from e
