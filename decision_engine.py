# =====================================================================
# decision_engine.py — محرك القرار الاستثماري
# يأخذ هامش الربح وفترة الاسترداد ويصنّف المشروع بنظام نقاط (من 4):
#   - هامش ربح قوي: +2
#   - هامش ربح متوسط: +1
#   - فترة استرداد ممتازة: +2
#   - فترة استرداد مقبولة: +1
# التصنيف النهائي:
#   3-4 = Suitable for Investment (مناسب للاستثمار)
#   2   = Moderate Risk (مخاطرة متوسطة)
#   0-1 = High Risk (مخاطرة عالية)
# =====================================================================

from saudi_assumptions import (
    STRONG_PROFIT_MARGIN,        # هامش ربح يعتبر قوي (مثلاً 20%)
    MODERATE_PROFIT_MARGIN,      # هامش ربح متوسط (مثلاً 10%)
    GOOD_PAYBACK_MONTHS,         # فترة استرداد ممتازة (مثلاً 12 شهر)
    ACCEPTABLE_PAYBACK_MONTHS,   # فترة استرداد مقبولة (مثلاً 24 شهر)
)


def classify_project(profit_margin_percent: float, payback_months):
    """
    يصنّف المشروع ويرجع:
      - classification: التصنيف النصي
      - score: النقاط (من 4)
      - reasons: قائمة بالأسباب المنطقية (تظهر للمستخدم)
    """
    score = 0
    reasons = []

    # ── تقييم هامش الربح ──
    profit_margin = profit_margin_percent / 100.0  # من نسبة مئوية إلى عدد عشري
    if profit_margin >= STRONG_PROFIT_MARGIN:
        score += 2
        reasons.append("Profit margin is strong.")
    elif profit_margin >= MODERATE_PROFIT_MARGIN:
        score += 1
        reasons.append("Profit margin is moderate.")
    else:
        reasons.append("Profit margin is low.")

    # ── تقييم فترة الاسترداد ──
    if payback_months is None:
        # الربح سلبي → ما نقدر نحسب فترة استرداد
        reasons.append("Payback period cannot be computed (profit is not positive).")
    elif payback_months <= GOOD_PAYBACK_MONTHS:
        score += 2
        reasons.append("Payback period is excellent.")
    elif payback_months <= ACCEPTABLE_PAYBACK_MONTHS:
        score += 1
        reasons.append("Payback period is acceptable.")
    else:
        reasons.append("Payback period is long (higher risk).")

    # ── التصنيف النهائي بناءً على مجموع النقاط ──
    if score >= 3:
        classification = "Suitable for Investment"
    elif score == 2:
        classification = "Moderate Risk"
    else:
        classification = "High Risk"

    return {
        "classification": classification,
        "score": score,
        "reasons": reasons,
    }
