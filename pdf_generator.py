from playwright.sync_api import sync_playwright
from jinja2 import Template


HTML_TEMPLATE = """
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', 'Arial', sans-serif;
    color: #1a1a2e;
    font-size: 13px;
    line-height: 1.7;
    background: #fff;
  }

  .cover {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover .brand { font-size: 14px; letter-spacing: 4px; color: #64b5f6; margin-bottom: 40px; }
  .cover h1 { font-size: 36px; font-weight: 900; line-height: 1.3; margin-bottom: 16px; }
  .cover .subtitle { font-size: 16px; color: #90caf9; margin-bottom: 50px; }
  .cover .meta { display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; }
  .cover .meta-item { text-align: center; }
  .cover .meta-item .val { font-size: 22px; font-weight: 700; color: #64b5f6; }
  .cover .meta-item .key { font-size: 11px; color: #90caf9; margin-top: 4px; }
  .cover .decision-badge {
    margin-top: 40px;
    padding: 10px 28px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 15px;
    border: 2px solid;
  }
  .badge-suitable  { border-color: #4caf50; color: #4caf50; background: rgba(76,175,80,.1); }
  .badge-moderate  { border-color: #ff9800; color: #ff9800; background: rgba(255,152,0,.1); }
  .badge-high-risk { border-color: #f44336; color: #f44336; background: rgba(244,67,54,.1); }

  .page {
    padding: 48px 52px;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1e3a5f;
    padding-bottom: 10px;
    margin-bottom: 28px;
  }
  .page-header .section-title { font-size: 18px; font-weight: 700; color: #1e3a5f; }
  .page-header .brand-small { font-size: 11px; color: #999; letter-spacing: 2px; }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 16px;
    background: #fafcff;
  }
  .card h3 {
    font-size: 13px;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { background: #1e3a5f; color: #fff; padding: 9px 12px; text-align: right; font-weight: 600; }
  td { padding: 9px 12px; border-bottom: 1px solid #eef2f7; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8faff; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .kpi {
    flex: 1;
    min-width: 120px;
    background: #f0f6ff;
    border: 1px solid #bdd4f5;
    border-radius: 10px;
    padding: 14px 16px;
    text-align: center;
  }
  .kpi .kpi-val { font-size: 20px; font-weight: 900; color: #1e3a5f; }
  .kpi .kpi-label { font-size: 11px; color: #64748b; margin-top: 4px; }

  .competition-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .score-circle {
    width: 70px; height: 70px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e3a5f, #2563eb);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .score-circle .s-num { font-size: 22px; font-weight: 900; line-height: 1; }
  .score-circle .s-lbl { font-size: 9px; opacity: .8; }

  .comp-level-badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .level-low    { background: #dcfce7; color: #15803d; }
  .level-medium { background: #fef9c3; color: #a16207; }
  .level-high   { background: #fee2e2; color: #b91c1c; }

  .bullet-list { padding: 0; list-style: none; }
  .bullet-list li {
    padding: 7px 0 7px 0;
    border-bottom: 1px solid #eef2f7;
    padding-right: 16px;
    position: relative;
  }
  .bullet-list li::before { content: "◆"; color: #2563eb; font-size: 8px; position: absolute; right: 0; top: 10px; }
  .bullet-list li:last-child { border-bottom: none; }

  .rec-list { padding: 0; list-style: none; counter-reset: rec-counter; }
  .rec-list li {
    counter-increment: rec-counter;
    padding: 8px 36px 8px 0;
    border-bottom: 1px solid #eef2f7;
    position: relative;
  }
  .rec-list li::before {
    content: counter(rec-counter);
    position: absolute; right: 0; top: 8px;
    width: 22px; height: 22px;
    background: #2563eb; color: #fff;
    border-radius: 50%;
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    text-align: center; line-height: 22px;
  }
  .rec-list li:last-child { border-bottom: none; }

  .direct-row td { background: #fff5f5 !important; }
  .tag-direct   { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .tag-indirect { background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 4px; font-size: 11px; }

  .risk-row td:first-child { color: #b91c1c; font-weight: 600; }
  .risk-row td:last-child  { color: #15803d; }

  .footer {
    text-align: center; color: #94a3b8; font-size: 10px;
    padding: 20px 0 0; border-top: 1px solid #e2e8f0; margin-top: 20px;
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="brand">MUQADDIM · مقدّم</div>
  <h1>{{ report.title }}</h1>
  <div class="subtitle">دراسة جدوى استثمارية — {{ report.business_overview.city }}</div>
  <div class="meta">
    <div class="meta-item">
      <div class="val">{{ report.financial_summary.monthly_revenue | int }} ر.س</div>
      <div class="key">إيراد شهري متوقع</div>
    </div>
    <div class="meta-item">
      <div class="val">{{ report.financial_summary.profit_margin_percent }}%</div>
      <div class="key">هامش الربح</div>
    </div>
    <div class="meta-item">
      <div class="val">
        {% if report.financial_summary.payback_period_months %}
          {{ report.financial_summary.payback_period_months | round(1) }} شهر
        {% else %}—{% endif %}
      </div>
      <div class="key">فترة الاسترداد</div>
    </div>
    {% if market_analysis %}
    <div class="meta-item">
      <div class="val">{{ market_analysis.market_opportunity_score }}/10</div>
      <div class="key">فرصة السوق</div>
    </div>
    {% endif %}
  </div>
  {% set cls = report.decision.classification | lower %}
  {% if 'suitable' in cls %}
    <div class="decision-badge badge-suitable">✅ مناسب للاستثمار</div>
  {% elif 'moderate' in cls %}
    <div class="decision-badge badge-moderate">⚠️ مخاطرة متوسطة</div>
  {% else %}
    <div class="decision-badge badge-high-risk">🔴 مخاطرة عالية</div>
  {% endif %}
</div>


<!-- PAGE 1: الملخص + نظرة عامة -->
<div class="page">
  <div class="page-header">
    <div class="section-title">الملخص التنفيذي ونظرة عامة</div>
    <div class="brand-small">MUQADDIM</div>
  </div>
  <div class="card">
    <h3>الملخص التنفيذي</h3>
    <p>{{ report.executive_summary }}</p>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3>نظرة عامة على المشروع</h3>
      <table>
        <tr><td style="color:#64748b;width:40%">نوع المشروع</td><td><strong>{{ report.business_overview.business_type }}</strong></td></tr>
        <tr><td style="color:#64748b">المدينة</td><td>{{ report.business_overview.city }}</td></tr>
        <tr><td style="color:#64748b">العملاء المستهدفون</td><td>{{ report.business_overview.target_customers }}</td></tr>
        <tr><td style="color:#64748b">عرض القيمة</td><td>{{ report.business_overview.value_proposition }}</td></tr>
      </table>
    </div>
    <div class="card">
      <h3>نتيجة القرار الاستثماري</h3>
      <table>
        <tr><td style="color:#64748b">التصنيف</td><td><strong>{{ report.decision.classification }}</strong></td></tr>
        <tr><td style="color:#64748b">النقاط</td><td>{{ report.decision.score }} / 4</td></tr>
      </table>
      <div style="margin-top:12px">
        {% for r in report.decision.reasons %}
        <div style="padding:5px 0; border-bottom:1px solid #eef2f7; font-size:12px; color:#374151">• {{ r }}</div>
        {% endfor %}
      </div>
    </div>
  </div>
  <div class="footer">دراسة جدوى مقدّم · تم الإنشاء تلقائياً · للاستخدام الاسترشادي فقط</div>
</div>


<!-- PAGE 2: التحليل المالي -->
<div class="page">
  <div class="page-header">
    <div class="section-title">التحليل المالي</div>
    <div class="brand-small">MUQADDIM</div>
  </div>
  {% set fs = report.financial_summary %}
  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-val">{{ fs.monthly_revenue | int }}</div>
      <div class="kpi-label">الإيراد الشهري (ر.س)</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">{{ fs.monthly_expenses | int }}</div>
      <div class="kpi-label">المصروفات الشهرية (ر.س)</div>
    </div>
    <div class="kpi" style="background:#f0fdf4; border-color:#bbf7d0">
      <div class="kpi-val" style="color:#15803d">{{ fs.monthly_net_profit | int }}</div>
      <div class="kpi-label">صافي الربح الشهري (ر.س)</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">{{ fs.profit_margin_percent }}%</div>
      <div class="kpi-label">هامش الربح</div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3>تفاصيل مالية</h3>
      <table>
        <tr><td style="color:#64748b">نقطة التعادل</td><td>{{ fs.break_even_revenue | int }} ر.س/شهر</td></tr>
        <tr><td style="color:#64748b">فترة الاسترداد</td>
          <td>{% if fs.payback_period_months %}{{ fs.payback_period_months | round(1) }} شهر{% else %}غير محدد (ربح سلبي){% endif %}</td>
        </tr>
      </table>
    </div>
    <div class="card">
      <h3>الخطوات القادمة</h3>
      <ul class="bullet-list">
        {% for s in report.next_steps %}
        <li>{{ s }}</li>
        {% endfor %}
      </ul>
    </div>
  </div>
  <div class="footer">دراسة جدوى مقدّم · تم الإنشاء تلقائياً · للاستخدام الاسترشادي فقط</div>
</div>


<!-- PAGE 3: تحليل السوق (Google + AI) -->
{% if market_analysis %}
<div class="page">
  <div class="page-header">
    <div class="section-title">تحليل السوق والمنافسين</div>
    <div class="brand-small">MUQADDIM · Google Places + AI</div>
  </div>
  {% set ma = market_analysis %}
  {% set ds = ma.direct_competitor_summary %}
  <div class="card">
    <div class="competition-header">
      <div class="score-circle">
        <div class="s-num">{{ ma.market_opportunity_score }}</div>
        <div class="s-lbl">/ 10</div>
      </div>
      <div>
        <div style="font-size:13px; font-weight:700; margin-bottom:6px">فرصة السوق</div>
        <span class="comp-level-badge
          {% if ma.competition_level == 'منخفض' %}level-low
          {% elif ma.competition_level == 'متوسط' %}level-medium
          {% else %}level-high{% endif %}">
          منافسة {{ ma.competition_level }}
        </span>
      </div>
      <div style="margin-right:auto; text-align:center">
        <div style="font-size:28px; font-weight:900; color:#b91c1c">{{ ds.count }}</div>
        <div style="font-size:11px; color:#64748b">منافس مباشر</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:28px; font-weight:900; color:#f59e0b">{{ ds.avg_rating }}</div>
        <div style="font-size:11px; color:#64748b">متوسط تقييمهم</div>
      </div>
    </div>
    <p style="color:#374151; font-size:13px; line-height:1.8">{{ ma.narrative }}</p>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3>أبرز النقاط</h3>
      <ul class="bullet-list">
        {% for b in ma.bullets %}<li>{{ b }}</li>{% endfor %}
      </ul>
    </div>
    <div class="card">
      <h3>التوصيات</h3>
      <ul class="rec-list">
        {% for r in ma.recommendations %}<li>{{ r }}</li>{% endfor %}
      </ul>
    </div>
  </div>
  {% if ma.classified_competitors %}
  <div class="card">
    <h3>تصنيف المطاعم المجاورة</h3>
    <table>
      <thead>
        <tr><th>الاسم</th><th>نوع المطبخ</th><th>التقييم</th><th>النوع</th><th>السبب</th></tr>
      </thead>
      <tbody>
        {% for c in ma.classified_competitors | sort(attribute='is_direct_competitor', reverse=True) %}
        {% set place = competitor_places | selectattr('id', 'equalto', c.id) | first | default({}) %}
        <tr {% if c.is_direct_competitor %}class="direct-row"{% endif %}>
          <td><strong>{{ place.name or c.id }}</strong></td>
          <td>{{ c.estimated_cuisine }}</td>
          <td>{% if place.rating %}⭐ {{ place.rating }}{% else %}—{% endif %}</td>
          <td>
            {% if c.is_direct_competitor %}<span class="tag-direct">مباشر</span>
            {% else %}<span class="tag-indirect">غير مباشر</span>{% endif %}
          </td>
          <td style="color:#64748b; font-size:11px">{{ c.reason_short }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>
  {% endif %}
  <div class="footer">البيانات مصدرها Google Places وتحليل الذكاء الاصطناعي · مقدّم</div>
</div>
{% endif %}


<!-- PAGE 4: المخاطر + تحليل السوق التقليدي -->
<div class="page">
  <div class="page-header">
    <div class="section-title">المخاطر وتحليل السوق التقليدي</div>
    <div class="brand-small">MUQADDIM</div>
  </div>
  <div class="card">
    <h3>المخاطر وخطط التخفيف</h3>
    <table>
      <thead><tr><th>المخاطرة</th><th>خطة التخفيف</th></tr></thead>
      <tbody>
        {% for r in report.risks_and_mitigations %}
        <tr class="risk-row"><td>{{ r.risk }}</td><td>{{ r.mitigation }}</td></tr>
        {% endfor %}
      </tbody>
    </table>
  </div>
  {% set mkt = report.market_analysis %}
  <div class="grid-2">
    <div class="card">
      <h3>لمحة الطلب</h3>
      <p style="color:#374151">{{ mkt.demand_snapshot }}</p>
      <div style="margin-top:10px; padding-top:10px; border-top:1px solid #eef2f7">
        <strong style="font-size:12px; color:#1e3a5f">مؤشرات التسعير:</strong>
        <p style="color:#374151; margin-top:4px">{{ mkt.pricing_insights }}</p>
      </div>
    </div>
    <div class="card">
      <h3>المنافسون (البيانات المدخلة)</h3>
      <table>
        <thead><tr><th>الاسم</th><th>نقطة قوة</th><th>نقطة ضعف</th></tr></thead>
        <tbody>
          {% for comp in mkt.competitors %}
          <tr>
            <td>{{ comp.name }}</td>
            <td style="color:#15803d">{{ comp.strength }}</td>
            <td style="color:#b91c1c">{{ comp.weakness }}</td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
  </div>
  <div class="footer">دراسة جدوى مقدّم · تم الإنشاء تلقائياً · للاستخدام الاسترشادي فقط</div>
</div>

</body>
</html>
"""


def build_feasibility_pdf(
    report: dict,
    market_analysis: dict = None,
    competitor_places: list = None,
) -> bytes:
    template = Template(HTML_TEMPLATE)
    html = template.render(
        report=report,
        market_analysis=market_analysis,
        competitor_places=competitor_places or [],
    )

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
        )
        browser.close()

    return pdf_bytes