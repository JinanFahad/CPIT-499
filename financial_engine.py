# =====================================================================
# financial_engine.py — حسابات الجدوى المالية
#
# المنطق الأساسي:
#   - المستخدم يدخل "العملاء المتوقعين يومياً" كهدف بعد استقرار المشروع.
#   - نطبّق منحنى تدرّج (Ramp-up) لـ 6 أشهر:
#       شهر 1: 50% من الهدف، شهر 2: 60%، ... شهر 6+: 100%
#   - المؤشرات الرئيسية (هامش الربح، فترة الاسترداد، ...) تُحسب على
#     أرقام التشغيل المستقر (شهر 6+) — لأن تقييم المشروع ما يصير من شهر 1.
#   - فترة الاسترداد تُحسب على التدفق التراكمي الواقعي (مع التدرّج).
#   - نُرجع توقع 12 شهر شهر-بشهر للعرض في الجدول/الرسم.
# =====================================================================

from saudi_assumptions import (
    DEFAULT_COGS,                # نسبة تكلفة المواد لكل نوع نشاط
    UTILITIES_RATE,              # نسبة المرافق من الإيراد
    OVERHEAD_RATE,               # نسبة التشغيل العام من الإيراد
    MARKETING_RATE,              # نسبة التسويق من الإيراد
    YEARLY_REVENUE_GROWTH,       # نمو سنوي للإيراد (السنة 2 و 3)
    YEARLY_COST_INFLATION,       # تضخم سنوي للرواتب والإيجار
    calculate_staff_salaries,    # توزيع الموظفين على الأدوار وحساب إجمالي الرواتب
    calculate_capital_allocation,  # توزيع رأس المال على بنود التأسيس
)
from success_predictor import predict_project_outcome

# منحنى التدرّج: شهر 1 = 50%، شهر 6+ = 100% (زيادة 10% شهرياً)
RAMP_UP_MONTHS = 6
RAMP_UP_START = 0.5

# نتوقع تدفقات تصل لـ 10 سنوات لحساب فترة الاسترداد لو طالت
PAYBACK_MAX_MONTHS = 120

# عدد سنوات التوقع المعروضة للمستخدم
PROJECTION_YEARS = 3


def _ramp_factor(month: int) -> float:
    """نسبة الإيراد المتوقعة في شهر معيّن قياساً على هدف الاستقرار.
    شهر 1 → 0.5، شهر 6+ → 1.0"""
    if month >= RAMP_UP_MONTHS:
        return 1.0
    return RAMP_UP_START + (1.0 - RAMP_UP_START) * (month - 1) / (RAMP_UP_MONTHS - 1)


def calculate_financials(data):
    """يحسب كل المؤشرات المالية للمشروع ويرجع dict جاهز للحفظ"""
    # ── المدخلات الأساسية ──
    business_type = data.get("business_type", "restaurant")
    capital = float(data["capital"])
    rent = float(data.get("rent") or 0)
    employees = int(data.get("employees") or 0)
    avg_price = float(data.get("avg_price") or 0)
    customers_per_day = float(data.get("customers_per_day") or 0)

    # ── نسبة تكلفة المواد (COGS) ──
    if data.get("cogs_known") and data.get("cogs_percent"):
        cogs_rate = float(data["cogs_percent"]) / 100
    else:
        cogs_rate = DEFAULT_COGS.get(business_type, 0.40)

    # ── الإيراد المستهدف بعد الاستقرار (شهر 6+) ──
    # نحسب الشهر بـ 28 يوم (احتياطي للإجازات وأيام انخفاض الإقبال)
    steady_daily_revenue = avg_price * customers_per_day
    steady_monthly_revenue = steady_daily_revenue * 28

    # ── التكاليف الثابتة (لا تتأثر بتدرّج الإيراد) ──
    staff = calculate_staff_salaries(employees)
    salaries = staff["total"]
    salary_breakdown = staff["breakdown"]
    fixed_monthly_costs = rent + salaries  # رواتب + إيجار = ثابتة من اليوم الأول

    # ── النسبة الإجمالية للتكاليف المتغيرة (% من الإيراد) ──
    variable_cost_rate = (
        cogs_rate +
        UTILITIES_RATE +
        OVERHEAD_RATE +
        MARKETING_RATE
    )

    def project_month(month_num: int) -> dict:
        """يحسب أرقام شهر معيّن مع منحنى التدرّج (سنة 1) أو نمو سنوي (سنة 2+).

        - سنة 1 (شهر 1-12): يطبّق منحنى التدرّج، بدون تضخم.
        - سنة 2 (شهر 13-24): إيراد +10%، تكاليف ثابتة +5%.
        - سنة 3 (شهر 25-36): إيراد ×1.21 من الأساس، تكاليف ×1.10 من الأساس.
        """
        year_index = (month_num - 1) // 12  # 0 لسنة 1، 1 لسنة 2، 2 لسنة 3...

        if year_index == 0:
            # سنة 1: تطبيق منحنى التدرّج
            ramp = _ramp_factor(month_num)
            revenue = steady_monthly_revenue * ramp
            inflated_fixed = fixed_monthly_costs
            display_pct = round(ramp * 100)
        else:
            # سنة 2+: إيراد ينمو + تكاليف ثابتة تتضخم سنوياً
            growth   = (1 + YEARLY_REVENUE_GROWTH) ** year_index
            inflate  = (1 + YEARLY_COST_INFLATION) ** year_index
            revenue  = steady_monthly_revenue * growth
            inflated_fixed = fixed_monthly_costs * inflate
            display_pct = round(growth * 100)  # 110 / 121 / ...

        variable_costs = revenue * variable_cost_rate
        expenses = inflated_fixed + variable_costs
        profit   = revenue - expenses

        return {
            "month":         month_num,
            "year":          year_index + 1,
            "ramp_percent":  display_pct,  # 50-100% في سنة 1، 110%/121% في 2/3
            "revenue":       round(revenue, 2),
            "expenses":      round(expenses, 2),
            "net_profit":    round(profit, 2),
        }

    # ── توقّع شهر-بشهر لـ 36 شهر (3 سنوات) ──
    full_projection = [project_month(m) for m in range(1, PROJECTION_YEARS * 12 + 1)]
    monthly_projection = full_projection[:12]  # سنة 1 فقط (للرسم القصير الموجود)

    # ── أرقام التشغيل المستقر (شهر 6+) — هذه هي اللي نقيّم بها المشروع ──
    steady = project_month(RAMP_UP_MONTHS)
    monthly_revenue   = steady["revenue"]
    monthly_expenses  = steady["expenses"]
    net_profit        = steady["net_profit"]
    profit_margin     = (net_profit / monthly_revenue) if monthly_revenue > 0 else 0

    # ── شهر 1 (للعرض كمقارنة في الواجهة) ──
    month_1 = monthly_projection[0]

    # ── إجماليات السنة الأولى (مع التدرّج) ──
    year_1_total_revenue  = sum(m["revenue"] for m in monthly_projection)
    year_1_total_expenses = sum(m["expenses"] for m in monthly_projection)
    year_1_total_profit   = sum(m["net_profit"] for m in monthly_projection)

    # ── إجماليات السنوات 2 و 3 + الربح التراكمي ──
    yearly_summary = []
    cumulative_so_far = 0.0
    for y in range(1, PROJECTION_YEARS + 1):
        year_months = [m for m in full_projection if m["year"] == y]
        y_revenue  = sum(m["revenue"] for m in year_months)
        y_expenses = sum(m["expenses"] for m in year_months)
        y_profit   = sum(m["net_profit"] for m in year_months)
        cumulative_so_far += y_profit
        yearly_summary.append({
            "year":               y,
            "revenue":            round(y_revenue, 2),
            "expenses":           round(y_expenses, 2),
            "net_profit":         round(y_profit, 2),
            "cumulative_profit":  round(cumulative_so_far, 2),
            # ROI تراكمي: نسبة استرداد رأس المال (100% = استرداد كامل)
            "cumulative_roi_pct": round(cumulative_so_far / capital * 100, 2) if capital > 0 else 0,
        })

    # منحنى الربح التراكمي شهر-بشهر (للرسم البياني — فترة الاسترداد ظاهرة بصرياً)
    cumulative_profit_curve = []
    running = 0.0
    for m in full_projection:
        running += m["net_profit"]
        cumulative_profit_curve.append({
            "month":              m["month"],
            "year":               m["year"],
            "cumulative_profit":  round(running, 2),
            "remaining_to_recoup": round(max(capital - running, 0), 2),
        })

    # ROI بعد 3 سنوات (ربح صافي / رأس المال)
    total_3_year_profit = yearly_summary[-1]["cumulative_profit"]
    roi_3_year_percent = round(total_3_year_profit / capital * 100, 2) if capital > 0 else 0

    # ── نقطة التعادل ──
    break_even_revenue = (
        fixed_monthly_costs / (1 - variable_cost_rate)
        if variable_cost_rate < 1 else 0
    )

    # أول شهر يصل فيه الإيراد المتوقع لنقطة التعادل
    break_even_month = None
    for m in monthly_projection:
        if m["revenue"] >= break_even_revenue:
            break_even_month = m["month"]
            break

    # ── فترة الاسترداد الواقعية (بناءً على التدفق التراكمي) ──
    # نتتبّع التراكم من شهر 1 (مع الخسائر المتوقعة في البداية) لحد ما يتجاوز
    # رأس المال. لو ما تجاوزه خلال 10 سنوات، نرجع None.
    payback_months = None
    cumulative = 0.0
    for month in range(1, PAYBACK_MAX_MONTHS + 1):
        m_data = project_month(month)
        cumulative += m_data["net_profit"]
        if cumulative >= capital:
            payback_months = month
            break

    # ── توزيع رأس المال على بنود التأسيس ──
    # نوزّعه بناءً على نوع المشروع (الكافيه ≠ الفاست فود في الاحتياجات)
    capital_breakdown = calculate_capital_allocation(business_type, capital)

    # ── التنبؤ بنجاح/فشل المشروع ──
    # نمرّر النتائج المالية + الاحتياطي + درجة السوق (لو متوفّرة) لمحرك التنبؤ
    market_score = data.get("market_opportunity_score")
    success_prediction = predict_project_outcome(
        financials={
            "profit_margin_percent": round(profit_margin * 100, 2),
            "roi_3_year_percent":    roi_3_year_percent,
            "payback_period_months": payback_months,
            "year_1_total_profit":   round(year_1_total_profit, 2),
        },
        capital_breakdown=capital_breakdown,
        market_score=market_score,
    )

    # ── تفاصيل التكلفة (على أرقام التشغيل المستقر للعرض في الجداول) ──
    cogs_steady      = monthly_revenue * cogs_rate
    utilities_steady = monthly_revenue * UTILITIES_RATE
    overhead_steady  = monthly_revenue * OVERHEAD_RATE
    marketing_steady = monthly_revenue * MARKETING_RATE

    return {
        # ── المؤشرات الرئيسية (تشغيل مستقر، شهر 6+) ──
        "monthly_revenue":         round(monthly_revenue, 2),
        "monthly_expenses":        round(monthly_expenses, 2),
        "monthly_net_profit":      round(net_profit, 2),
        "profit_margin_percent":   round(profit_margin * 100, 2),
        "break_even_revenue":      round(break_even_revenue, 2),
        "payback_period_months":   payback_months,

        # ── مؤشرات التدرّج (جديد) ──
        "month_1_revenue":         month_1["revenue"],
        "month_1_net_profit":      month_1["net_profit"],
        "break_even_month":        break_even_month,
        "monthly_projection":      monthly_projection,
        "year_1_total_revenue":    round(year_1_total_revenue, 2),
        "year_1_total_expenses":   round(year_1_total_expenses, 2),
        "year_1_total_profit":     round(year_1_total_profit, 2),
        "ramp_up_months":          RAMP_UP_MONTHS,

        # ── تفصيل التكلفة ──
        "salaries_total":          round(salaries, 2),
        "salary_breakdown":        salary_breakdown,
        "utilities_cost":          round(utilities_steady, 2),
        "overhead_cost":           round(overhead_steady, 2),
        "marketing_cost":          round(marketing_steady, 2),
        "cogs_cost":               round(cogs_steady, 2),

        # ── توقّع ٣ سنوات (تفصيلي) ──
        "yearly_summary":          yearly_summary,
        "cumulative_profit_curve": cumulative_profit_curve,
        "total_3_year_profit":     round(total_3_year_profit, 2),
        "roi_3_year_percent":      roi_3_year_percent,
        "yearly_revenue_growth":   YEARLY_REVENUE_GROWTH,
        "yearly_cost_inflation":   YEARLY_COST_INFLATION,

        # توافق مع الكود القديم: year_1/2/3_revenue (مكرّرة من yearly_summary)
        "year_1_revenue":          yearly_summary[0]["revenue"],
        "year_2_revenue":          yearly_summary[1]["revenue"],
        "year_3_revenue":          yearly_summary[2]["revenue"],

        "funding_needed":          round(capital, 2),

        # ── ميزات جديدة: توزيع رأس المال + التنبؤ ──
        "capital_allocation":      capital_breakdown["allocation"],
        "operating_cushion":       capital_breakdown["cushion_amount"],
        "success_prediction":      success_prediction,

        # ── ملخص المدخلات: عشان المستخدم يشوف بياناته في التقرير ──
        # هذي القيم اللي دخلها بنفسه (رأس المال، الموظفين، السعر، إلخ)
        "inputs_summary": {
            "capital":           round(capital, 2),
            "rent":              round(rent, 2),
            "employees":         employees,
            "avg_price":         round(avg_price, 2),
            "customers_per_day": round(customers_per_day, 2),
            "business_type":     business_type,
        },
    }
