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


# خريطة ترجمة التصنيفات والمصطلحات الشائعة من العربية إلى الإنجليزية.
# نستخدمها عند تمرير language="en" لتوحيد المخرج بلغة المستخدم.
_AR_TO_EN = {
    "مناسب للاستثمار":     "Suitable for Investment",
    "مخاطرة متوسطة":       "Moderate Risk",
    "قابل للتطبيق بشروط":  "Viable with Conditions",
    "مخاطرة عالية":        "High Risk",
}


def _translate_classification(classification_ar: str) -> str:
    """يُرجع النسخة الإنجليزية للتصنيف، أو نفس النص إذا غير معروف."""
    return _AR_TO_EN.get(classification_ar, classification_ar)


def classify_project(profit_margin_percent: float, payback_months, success_prediction: dict = None, language: str = "ar"):
    """يصنّف المشروع.

    إذا توفّر `success_prediction` (من success_predictor): نستخدم نتيجته كمصدر أساسي
    لأنه يقيّم 5 عوامل (هامش، ROI، استرداد، احتياطي، سوق) بدلاً من 2 فقط.
    التصنيف هذا يضمن إن شارة الغلاف ('مناسب' / 'متوسط' / 'عالية') تتوافق مع
    تنبؤ النجاح في تقرير الـ PDF والواجهة.

    لو ما توفر، نرجع للمنطق القديم (هامش + استرداد فقط).

    language: "ar" (افتراضي) أو "en" — يحدد لغة التصنيف في المخرج.
    لا يؤثر على الـ reasons لأنها تُولَّد بالعربية في الكلتا الحالتين،
    أما الفرونت لا يعرضها للمستخدم النهائي مباشرة في النسخة الإنجليزية.
    """
    # ── المسار الجديد: نستخدم نتيجة success_predictor إذا متوفّرة ──
    if success_prediction:
        outcome = success_prediction["outcome"]
        score_pct = success_prediction.get("score_percent", 0)
        # تحويل لنظام 0-4 (للتوافق مع الكود القديم)
        if score_pct >= 75:
            score = 4
        elif score_pct >= 55:
            score = 3
        elif score_pct >= 35:
            score = 2
        elif score_pct >= 15:
            score = 1
        else:
            score = 0
        # نأخذ تقييمات العوامل الـ 5 كأسباب
        reasons = [
            f"{f['name']}: {f['rating']} ({f['value']}) — {f['score']}/{f['weight']}"
            for f in success_prediction.get("factors", [])
        ]
        return {
            "classification": _translate_classification(outcome) if language == "en" else outcome,
            "score":          score,
            "reasons":        reasons,
        }

    # ── المسار القديم (Fallback) ──
    score = 0
    reasons = []

    # ── تقييم هامش الربح ──
    profit_margin = profit_margin_percent / 100.0  # من نسبة مئوية إلى عدد عشري
    if profit_margin >= STRONG_PROFIT_MARGIN:
        score += 2
        reasons.append(f"هامش ربح قوي ({profit_margin_percent}%) — أعلى من معيار {int(STRONG_PROFIT_MARGIN*100)}% للقطاع.")
    elif profit_margin >= MODERATE_PROFIT_MARGIN:
        score += 1
        reasons.append(f"هامش ربح مقبول ({profit_margin_percent}%) — ضمن المعدل الطبيعي لقطاع المطاعم ({int(MODERATE_PROFIT_MARGIN*100)}% فأكثر).")
    elif profit_margin >= 0.03:
        # هامش موجب لكن ضعيف — ما يحصّل نقطة كاملة لكن مو "فشل"
        reasons.append(f"هامش ربح ضعيف ({profit_margin_percent}%) — موجب لكن أقل من المعدل الصحي ({int(MODERATE_PROFIT_MARGIN*100)}%).")
    elif profit_margin >= 0:
        reasons.append(f"هامش ربح حدّي ({profit_margin_percent}%) — قرب الصفر، يحتاج تحسين قبل البدء.")
    else:
        reasons.append(f"هامش ربح سالب ({profit_margin_percent}%) — المشروع خاسر حتى عند الاستقرار.")

    # ── تقييم فترة الاسترداد ──
    if payback_months is None:
        reasons.append("لا يمكن حساب فترة استرداد لأن الربح الصافي غير موجب.")
    elif payback_months <= GOOD_PAYBACK_MONTHS:
        score += 2
        reasons.append(f"فترة استرداد ممتازة ({round(payback_months)} شهر) — أقل من معيار القطاع ({GOOD_PAYBACK_MONTHS} شهر).")
    elif payback_months <= ACCEPTABLE_PAYBACK_MONTHS:
        score += 1
        reasons.append(f"فترة استرداد مقبولة ({round(payback_months)} شهر) — ضمن المتوقع لقطاع المطاعم ({ACCEPTABLE_PAYBACK_MONTHS} شهر فأقل).")
    elif payback_months <= 72:
        reasons.append(f"فترة استرداد طويلة ({round(payback_months)} شهر) — أعلى من المتوسط لكن ضمن النطاق الممكن.")
    else:
        reasons.append(f"فترة استرداد طويلة جداً ({round(payback_months)} شهر) — مخاطرة عالية.")

    # ── التصنيف النهائي بناءً على مجموع النقاط ──
    if score >= 3:
        classification = "مناسب للاستثمار"
    elif score == 2:
        classification = "مخاطرة متوسطة"
    elif score == 1:
        # هامش ربح إيجابي + استرداد ضمن الممكن، أو هامش قوي مع استرداد طويل
        classification = "قابل للتطبيق بشروط"
    else:
        classification = "مخاطرة عالية"

    return {
        "classification": _translate_classification(classification) if language == "en" else classification,
        "score": score,
        "reasons": reasons,
    }
