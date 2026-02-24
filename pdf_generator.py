from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# اختياري: خط عربي (لازم يكون عندك ملف خط)
# إذا ما عندك خط عربي الآن، خلّيه مؤقتًا وخلي النص إنجليزي
# pdfmetrics.registerFont(TTFont("Cairo", "Cairo-Regular.ttf"))

def build_feasibility_pdf(report: dict) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50

    def line(text, size=12):
        nonlocal y
        c.setFont("Helvetica", size)
        c.drawString(50, y, text)
        y -= 18
        if y < 60:
            c.showPage()
            y = height - 50

    line(report.get("title", "Feasibility Report"), 16)
    y -= 10

    line("Executive Summary:", 13)
    line(report.get("executive_summary", "")[:1200], 11)
    y -= 10

    fs = report.get("financial_summary", {})
    line("Financial Summary:", 13)
    line(f"Monthly Revenue: {fs.get('monthly_revenue')}")
    line(f"Monthly Expenses: {fs.get('monthly_expenses')}")
    line(f"Monthly Net Profit: {fs.get('monthly_net_profit')}")
    line(f"Profit Margin (%): {fs.get('profit_margin_percent')}")
    line(f"Break-even Revenue: {fs.get('break_even_revenue')}")
    line(f"Payback Period (months): {fs.get('payback_period_months')}")
    y -= 10

    d = report.get("decision", {})
    line("Decision:", 13)
    line(f"Classification: {d.get('classification')}")
    line(f"Score: {d.get('score')}")
    for r in d.get("reasons", [])[:6]:
        line(f"- {r}", 11)
    y -= 10

    line("Risks & Mitigations:", 13)
    for item in report.get("risks_and_mitigations", [])[:6]:
        line(f"Risk: {item.get('risk','')}", 11)
        line(f"Mitigation: {item.get('mitigation','')}", 11)
        y -= 6

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer.getvalue()