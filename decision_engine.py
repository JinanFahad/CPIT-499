# decision_engine.py
# Investment decision module. Scores a project from 0 to 4 based on profit
# margin and payback period, then maps the score to one of four classifications.

from saudi_assumptions import (
    STRONG_PROFIT_MARGIN,
    MODERATE_PROFIT_MARGIN,
    GOOD_PAYBACK_MONTHS,
    ACCEPTABLE_PAYBACK_MONTHS,
)


# Maps the Arabic classification strings to English for clients that
# requested the report with language="en".
_AR_TO_EN = {
    "مناسب للاستثمار":     "Suitable for Investment",
    "مخاطرة متوسطة":       "Moderate Risk",
    "قابل للتطبيق بشروط":  "Viable with Conditions",
    "مخاطرة عالية":        "High Risk",
}


def _translate_classification(classification_ar: str) -> str:
    return _AR_TO_EN.get(classification_ar, classification_ar)


def classify_project(profit_margin_percent: float, payback_months, success_prediction: dict = None, language: str = "ar"):
    """Classify a project as suitable / moderate / high-risk.

    Preferred path: use the output of success_predictor (5-factor analysis)
    if it was passed in. This keeps the cover badge aligned with the success
    prediction shown in the PDF and in the UI.

    Fallback path: simple 2-factor scoring on margin and payback only.

    The language parameter only affects the classification label in the
    returned dict. Reasons are produced in Arabic regardless.
    """
    # Preferred path. Translate the percent score to the legacy 0-4 score
    # so existing consumers of this function keep working.
    if success_prediction:
        outcome = success_prediction["outcome"]
        score_pct = success_prediction.get("score_percent", 0)
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
        reasons = [
            f"{f['name']}: {f['rating']} ({f['value']}) — {f['score']}/{f['weight']}"
            for f in success_prediction.get("factors", [])
        ]
        return {
            "classification": _translate_classification(outcome) if language == "en" else outcome,
            "score":          score,
            "reasons":        reasons,
        }

    # Fallback scoring. Only used if success_prediction was not provided.
    score = 0
    reasons = []

    profit_margin = profit_margin_percent / 100.0
    if profit_margin >= STRONG_PROFIT_MARGIN:
        score += 2
        reasons.append(f"هامش ربح قوي ({profit_margin_percent}%) — أعلى من معيار {int(STRONG_PROFIT_MARGIN*100)}% للقطاع.")
    elif profit_margin >= MODERATE_PROFIT_MARGIN:
        score += 1
        reasons.append(f"هامش ربح مقبول ({profit_margin_percent}%) — ضمن المعدل الطبيعي لقطاع المطاعم ({int(MODERATE_PROFIT_MARGIN*100)}% فأكثر).")
    elif profit_margin >= 0.03:
        reasons.append(f"هامش ربح ضعيف ({profit_margin_percent}%) — موجب لكن أقل من المعدل الصحي ({int(MODERATE_PROFIT_MARGIN*100)}%).")
    elif profit_margin >= 0:
        reasons.append(f"هامش ربح حدّي ({profit_margin_percent}%) — قرب الصفر، يحتاج تحسين قبل البدء.")
    else:
        reasons.append(f"هامش ربح سالب ({profit_margin_percent}%) — المشروع خاسر حتى عند الاستقرار.")

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

    if score >= 3:
        classification = "مناسب للاستثمار"
    elif score == 2:
        classification = "مخاطرة متوسطة"
    elif score == 1:
        classification = "قابل للتطبيق بشروط"
    else:
        classification = "مخاطرة عالية"

    return {
        "classification": _translate_classification(classification) if language == "en" else classification,
        "score": score,
        "reasons": reasons,
    }
