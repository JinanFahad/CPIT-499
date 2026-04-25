# =====================================================================
# financial_engine.py — حسابات الجدوى المالية
# يأخذ بيانات المشروع ويحسب:
#   - الإيراد الشهري والمصاريف وصافي الربح
#   - هامش الربح ونقطة التعادل
#   - فترة الاسترداد
#   - توقعات الإيرادات لـ 3 سنوات
# لا يستخدم الذكاء الاصطناعي — كل الحسابات معادلات رياضية بسيطة
# =====================================================================

from saudi_assumptions import (
    DEFAULT_COGS,        # نسبة تكلفة المواد لكل نوع نشاط
    DEFAULT_SALARY,      # متوسط راتب موظف في السعودية
    UTILITIES_RATE,      # نسبة المرافق من الإيراد
    OVERHEAD_RATE,       # نسبة التشغيل العام من الإيراد
    MARKETING_RATE,      # نسبة التسويق من الإيراد
)

def calculate_financials(data):
    """يحسب كل المؤشرات المالية للمشروع ويرجع dict جاهز للحفظ"""
    # ── المدخلات الأساسية ──
    business_type = data.get("business_type", "restaurant")
    capital = float(data["capital"])
    rent = float(data.get("rent") or 0)
    employees = int(data.get("employees") or 0)
    avg_price = float(data.get("avg_price") or 0)
    customers_per_day = float(data.get("customers_per_day") or 0)

    avg_salary = float(data.get("avg_salary") or DEFAULT_SALARY)

    # ── نسبة تكلفة المواد (COGS) ──
    # لو المستخدم يعرف النسبة الفعلية، نستخدمها. وإلا، نأخذ النسبة الافتراضية حسب نوع النشاط
    if data.get("cogs_known") and data.get("cogs_percent"):
        cogs_rate = float(data["cogs_percent"]) / 100
    else:
        cogs_rate = DEFAULT_COGS.get(business_type, 0.40)

    # ── حساب الإيراد ──
    # نحسب الشهر بـ 28 يوم (احتياطي للإجازات وأيام انخفاض الإقبال)
    daily_revenue = avg_price * customers_per_day
    monthly_revenue = daily_revenue * 28

    # ── حساب التكاليف المتغيرة (نسبة من الإيراد) ──
    utilities = monthly_revenue * UTILITIES_RATE   # كهرباء، ماء، إنترنت
    overhead = monthly_revenue * OVERHEAD_RATE     # صيانة، أدوات، مصاريف عامة
    marketing = monthly_revenue * MARKETING_RATE   # إعلانات وتسويق

    # ── حساب التكاليف الثابتة والإجمالية ──
    salaries = employees * avg_salary
    cogs = monthly_revenue * cogs_rate

    fixed_costs = rent + salaries  # تكاليف ثابتة لا تتأثر بحجم المبيعات
    monthly_expenses = (
        rent +
        salaries +
        cogs +
        utilities +
        overhead +
        marketing
    )

    # ── المؤشرات النهائية ──
    net_profit = monthly_revenue - monthly_expenses
    profit_margin = (net_profit / monthly_revenue) if monthly_revenue > 0 else 0

    # نقطة التعادل: الإيراد المطلوب لتغطية التكاليف الثابتة (بعد طرح المتغيرة)
    variable_cost_rate = (
        cogs_rate +
        UTILITIES_RATE +
        OVERHEAD_RATE +
        MARKETING_RATE
    )

    break_even_revenue = (
        fixed_costs / (1 - variable_cost_rate)
        if variable_cost_rate < 1 else 0
    )

    # فترة الاسترداد: كم شهر نحتاج عشان نسترد رأس المال (None لو الربح سلبي)
    payback_months = capital / net_profit if net_profit > 0 else None

    # توقعات ٣ سنوات (نمو 10% سنوياً)
    year_1_revenue = monthly_revenue * 12
    year_2_revenue = year_1_revenue * 1.10
    year_3_revenue = year_2_revenue * 1.10

    funding_needed = capital

    return {
        "monthly_revenue": round(monthly_revenue, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "monthly_net_profit": round(net_profit, 2),
        "profit_margin_percent": round(profit_margin * 100, 2),
        "break_even_revenue": round(break_even_revenue, 2),
        "payback_period_months": round(payback_months, 2) if payback_months is not None else None,

        "utilities_cost": round(utilities, 2),
        "overhead_cost": round(overhead, 2),
        "marketing_cost": round(marketing, 2),

        "year_1_revenue": round(monthly_revenue * 12, 2),
        "year_2_revenue": round(monthly_revenue * 12 * 1.10, 2),
        "year_3_revenue": round(monthly_revenue * 12 * 1.10 * 1.10, 2),

        "funding_needed": round(funding_needed, 2)
    }