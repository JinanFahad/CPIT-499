from playwright.sync_api import sync_playwright
from jinja2 import Template

LOGO_B64 = "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zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzy8LTzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzyK0HzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzikA1ynzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzkS/zynzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzyP/zzynzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzytbzzynzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzytbzz2nzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzw7/zIE9zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzpsj7zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz2ES3zyH/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz9E8zzzyPzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzhMkbzzzzwj/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzobzzzXwn3TzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwEzzzwJegSDrzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwHzzzwJei8pVPTzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwHzzzwJej/wAtJd9888888888888888888888888888888888888888888888888888888888888888888B8888CXo/8APPI/vPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAfPPPAl6P/ADzwP7zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwHzzzwJej/wA88D+888888888888888888888888888888888888888888888888888888888888888888B8888CXo/8APPA/vPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPBNPPPAl6P/ADzwn7zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzx3zzwJej/wA888c888888888888888888888888888888888888888888888888888888888888888888Af888CXo/8APPI3/PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAfPPPA36P/ADzwP7zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwGHIIN12gMIIKD7zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzy7/8A/vd8e/vPf/d888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888/8QAHhEAAgEFAQEBAAAAAAAAAAAAAAExESAhQWBhEJD/2gAIAQMBAT8Q/UleGxVs8ahKsdgh8ONUsIbbG8JUgc8XRVA5xcPrnjFMbHPFykdjni5SP62llm+LTlsZQfxWCGtkc88YTIfgiI4yG0ss1hJsLWfpidA9M8QvBDWyOeWISisxBk1jh2vCgiBdxjwKbPDUKCcI+voaEJVCVCFvHENCDuWUaFXiIjQg7WElIBWSGmRywxCVXCaEHawkpB8aTwzeGPUTqq8HoQdrCSkVi0cj4PQg7WElILJSHg9CDtYSUgslIeD0IO1hJSCyUh4Nzo0QdrCSkFjDoI+ESSi1hJSDiHaaaHpm5ZSCxraGY4PQg7GMJKQWSkPB6DYfVYseiEqKiJRKVFYqxqsh4NMjxPE8TxEksL43OrPE8TxPE8RElF+eX//EAB0RAAMBAQEBAQEBAAAAAAAAAAABMRFgIBBRkCH/2gAIAQIBAT8Q/qSlpjjcEhvONQg/xxqDeDe8dA7x8DvHwO8eng78SEsHxhLR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"

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
    background: linear-gradient(135deg, #0a1f0f 0%, #1a4a2e 40%, #0d3320 70%, #0a1f0f 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #fff;
    text-align: center;
    padding: 60px 40px;
    page-break-after: always;
  }
  .cover .brand { font-size: 14px; letter-spacing: 4px; color: #6fcf97; margin-bottom: 20px; }
  .cover h1 { font-size: 36px; font-weight: 900; line-height: 1.3; margin-bottom: 16px; }
  .cover .subtitle { font-size: 16px; color: #a8d5b5; margin-bottom: 50px; }
  .cover .meta { display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; }
  .cover .meta-item { text-align: center; }
  .cover .meta-item .val { font-size: 22px; font-weight: 700; color: #6fcf97; }
  .cover .meta-item .key { font-size: 11px; color: #a8d5b5; margin-top: 4px; }
  .cover .decision-badge {
    margin-top: 40px;
    padding: 10px 28px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 15px;
    border: 2px solid;
  }
  .badge-suitable  { border-color: #4caf50; color: #4caf50; background: rgba(76,175,80,.15); }
  .badge-moderate  { border-color: #ff9800; color: #ff9800; background: rgba(255,152,0,.15); }
  .badge-high-risk { border-color: #f44336; color: #f44336; background: rgba(244,67,54,.15); }

  .page {
    padding: 48px 52px;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1a4a2e;
    padding-bottom: 10px;
    margin-bottom: 28px;
  }
  .page-header .section-title { font-size: 18px; font-weight: 700; color: #1a4a2e; }
  .page-header .logo-small { width: 36px; height: 36px; object-fit: contain; }

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
    color: #1a4a2e;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { background: #1a4a2e; color: #fff; padding: 9px 12px; text-align: right; font-weight: 600; }
  td { padding: 9px 12px; border-bottom: 1px solid #eef2f7; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f3faf5; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .kpi {
    flex: 1;
    min-width: 120px;
    background: #f0faf3;
    border: 1px solid #a8d5b5;
    border-radius: 10px;
    padding: 14px 16px;
    text-align: center;
  }
  .kpi .kpi-val { font-size: 20px; font-weight: 900; color: #1a4a2e; }
  .kpi .kpi-label { font-size: 11px; color: #64748b; margin-top: 4px; }

  .competition-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .score-circle {
    width: 70px; height: 70px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a4a2e, #27ae60);
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
  .bullet-list li::before { content: "◆"; color: #27ae60; font-size: 8px; position: absolute; right: 0; top: 10px; }
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
    background: #27ae60; color: #fff;
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
  <img src="data:image/jpeg;base64,{{ logo_b64 }}" style="width:90px;height:90px;object-fit:contain;margin-bottom:20px;filter:brightness(0) invert(1);" />
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


<!-- PAGE 1 -->
<div class="page">
  <div class="page-header">
    <div class="section-title">الملخص التنفيذي ونظرة عامة</div>
    <img src="data:image/jpeg;base64,{{ logo_b64 }}" class="logo-small" />
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


<!-- PAGE 2 -->
<div class="page">
  <div class="page-header">
    <div class="section-title">التحليل المالي</div>
    <img src="data:image/jpeg;base64,{{ logo_b64 }}" class="logo-small" />
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
        {% for s in report.next_steps %}<li>{{ s }}</li>{% endfor %}
      </ul>
    </div>
  </div>
  <div class="footer">دراسة جدوى مقدّم · تم الإنشاء تلقائياً · للاستخدام الاسترشادي فقط</div>
</div>


<!-- PAGE 3: تحليل السوق -->
{% if market_analysis %}
<div class="page">
  <div class="page-header">
    <div class="section-title">تحليل السوق والمنافسين</div>
    <img src="data:image/jpeg;base64,{{ logo_b64 }}" class="logo-small" />
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
      <ul class="bullet-list">{% for b in ma.bullets %}<li>{{ b }}</li>{% endfor %}</ul>
    </div>
    <div class="card">
      <h3>التوصيات</h3>
      <ul class="rec-list">{% for r in ma.recommendations %}<li>{{ r }}</li>{% endfor %}</ul>
    </div>
  </div>
  {% if ma.classified_competitors %}
  <div class="card">
    <h3>تصنيف المطاعم المجاورة</h3>
    <table>
      <thead><tr><th>الاسم</th><th>نوع المطبخ</th><th>التقييم</th><th>النوع</th><th>السبب</th></tr></thead>
      <tbody>
        {% for c in ma.classified_competitors | sort(attribute='is_direct_competitor', reverse=True) %}
        {% set place = competitor_places | selectattr('id', 'equalto', c.id) | first | default({}) %}
        <tr {% if c.is_direct_competitor %}class="direct-row"{% endif %}>
          <td><strong>{{ place.name or c.id }}</strong></td>
          <td>{{ c.estimated_cuisine }}</td>
          <td>{% if place.rating %}⭐ {{ place.rating }}{% else %}—{% endif %}</td>
          <td>{% if c.is_direct_competitor %}<span class="tag-direct">مباشر</span>{% else %}<span class="tag-indirect">غير مباشر</span>{% endif %}</td>
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


<!-- PAGE 4 -->
<div class="page">
  <div class="page-header">
    <div class="section-title">المخاطر وتحليل السوق التقليدي</div>
    <img src="data:image/jpeg;base64,{{ logo_b64 }}" class="logo-small" />
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
        <strong style="font-size:12px; color:#1a4a2e">مؤشرات التسعير:</strong>
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
        logo_b64=LOGO_B64,
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