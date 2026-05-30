# Project success prediction model based on five weighted factors.

def predict_project_outcome(
    financials: dict,
    capital_breakdown: dict = None,
    market_score: int = None,
    language: str = "ar",
) -> dict:
    """Score the project on the five factors above and return a structured
    result with: score, max_score, score_percent, outcome label, color code,
    emoji, advisory message, and the per-factor breakdown.

    The language parameter only affects the strings in the returned dict.
    Arabic is the source-of-truth; English values are produced by a small
    dictionary lookup at the end.
    """
    score = 0
    max_score = 0
    factors = []


    margin = financials.get("profit_margin_percent", 0)
    max_score += 25
    if margin >= 15:
        f_score, rating = 25, "ممتاز"
    elif margin >= 10:
        f_score, rating = 22, "جيد جداً"
    elif margin >= 7:
        f_score, rating = 18, "جيد (المعدل الطبيعي للقطاع)"
    elif margin >= 4:
        f_score, rating = 13, "مقبول"
    elif margin >= 1:
        f_score, rating = 7, "ضعيف لكن موجب"
    elif margin >= 0:
        f_score, rating = 2, "حدّي (قرب الصفر)"
    else:
        f_score, rating = 0, "سلبي"
    score += f_score
    factors.append({
        "name":   "هامش الربح المستقر",
        "value":  f"{margin}%",
        "rating": rating,
        "score":  f_score,
        "weight": 25,
    })


    roi = financials.get("roi_3_year_percent", 0)
    max_score += 30
    if roi >= 100:
        f_score, rating = 30, "ممتاز (استرداد + ضعف خلال 3 سنوات)"
    elif roi >= 60:
        f_score, rating = 25, "جيد جداً"
    elif roi >= 30:
        f_score, rating = 20, "جيد (ضمن المتوقع للقطاع)"
    elif roi >= 15:
        f_score, rating = 14, "مقبول"
    elif roi >= 5:
        f_score, rating = 8, "ضعيف"
    elif roi >= 0:
        f_score, rating = 3, "بالكاد موجب"
    else:
        f_score, rating = 0, "خسارة صافية"
    score += f_score
    factors.append({
        "name":   "العائد على الاستثمار (3 سنوات)",
        "value":  f"{roi:.1f}%",
        "rating": rating,
        "score":  f_score,
        "weight": 30,
    })


    payback = financials.get("payback_period_months")
    max_score += 20
    if payback is None:
        f_score, rating, value = 0, "لا يحدث (الربح غير موجب)", "—"
    elif payback <= 24:
        f_score, rating, value = 20, "ممتاز", f"{int(payback)} شهر"
    elif payback <= 36:
        f_score, rating, value = 17, "جيد جداً", f"{int(payback)} شهر"
    elif payback <= 48:
        f_score, rating, value = 13, "جيد (المعدل الطبيعي للقطاع)", f"{int(payback)} شهر"
    elif payback <= 60:
        f_score, rating, value = 9, "مقبول", f"{int(payback)} شهر"
    elif payback <= 72:
        f_score, rating, value = 5, "طويل لكن ممكن", f"{int(payback)} شهر"
    elif payback <= 96:
        f_score, rating, value = 2, "طويل جداً", f"{int(payback)} شهر"
    else:
        f_score, rating, value = 0, "غير عملي", f"{int(payback)} شهر"
    score += f_score
    factors.append({
        "name":   "فترة الاسترداد",
        "value":  value,
        "rating": rating,
        "score":  f_score,
        "weight": 20,
    })



    max_score += 15
    year_1_profit = financials.get("year_1_total_profit", 0)
    cushion = (capital_breakdown or {}).get("cushion_amount", 0)
    if year_1_profit >= 0:
        f_score, rating = 15, "ممتاز (السنة 1 رابحة)"
        cushion_value = "غير مطلوب"
    elif cushion <= 0:
        f_score, rating = 0, "غير محسوب"
        cushion_value = "—"
    else:
        loss_year_1 = abs(year_1_profit)
        coverage = cushion / loss_year_1
        cushion_value = f"احتياطي {cushion:,.0f} مقابل خسارة {loss_year_1:,.0f}"
        if coverage >= 2:
            f_score, rating = 15, "ممتاز (يغطي الخسائر بأمان)"
        elif coverage >= 1:
            f_score, rating = 10, "كافٍ بحدّ أدنى"
        elif coverage >= 0.6:
            f_score, rating = 4, "غير كافٍ — خطر تعثّر"
        else:
            f_score, rating = 0, "غير كافٍ على الإطلاق"
    score += f_score
    factors.append({
        "name":   "كفاية الاحتياطي التشغيلي",
        "value":  cushion_value,
        "rating": rating,
        "score":  f_score,
        "weight": 15,
    })


    max_score += 10
    if market_score is None:
        f_score, rating, value = 5, "غير محدّد (افتراضي)", "—"
    elif market_score >= 8:
        f_score, rating, value = 10, "ممتاز", f"{market_score}/10"
    elif market_score >= 6:
        f_score, rating, value = 7, "جيد", f"{market_score}/10"
    elif market_score >= 4:
        f_score, rating, value = 4, "متوسط", f"{market_score}/10"
    else:
        f_score, rating, value = 1, "ضعيف (سوق مشبع/ضعيف الطلب)", f"{market_score}/10"
    score += f_score
    factors.append({
        "name":   "فرصة السوق",
        "value":  value,
        "rating": rating,
        "score":  f_score,
        "weight": 10,
    })

    # Final outcome
    if score >= 75:
        outcome       = "نجاح مرتفع"
        outcome_color = "green"
        outcome_emoji = "🟢"
        message = (
            "كل المؤشرات تدعم نجاح المشروع. تنفيذ منضبط للخطة المالية والتشغيلية "
            "متوقع أن يحقق العائد المستهدف خلال الإطار الزمني المتوقّع."
        )
    elif score >= 55:
        outcome       = "نجاح محتمل"
        outcome_color = "lightgreen"
        outcome_emoji = "🟢"
        message = (
            "المشروع واعد، لكن يحتاج متابعة دقيقة لمؤشرات الأداء (KPI) شهرياً، "
            "والاستعداد لتعديل الخطة عند الانحراف عن المستهدف."
        )
    elif score >= 35:
        outcome       = "مخاطرة متوسطة"
        outcome_color = "amber"
        outcome_emoji = "🟡"
        message = (
            "المشروع قابل للتطبيق لكنه يحتاج تحسينات جوهرية قبل البدء — مثل "
            "إعادة هيكلة التكاليف، رفع الأسعار، أو تقليل عدد الموظفين."
        )
    elif score >= 15:
        outcome       = "مخاطرة عالية"
        outcome_color = "orange"
        outcome_emoji = "🟠"
        message = (
            "المؤشرات الحالية ضعيفة. يُنصح بمراجعة جوهرية للنموذج الاقتصادي "
            "(تكاليف، تسعير، حجم فريق) قبل الالتزام بأي استثمار."
        )
    else:
        outcome       = "احتمال فشل عالي"
        outcome_color = "red"
        outcome_emoji = "🔴"
        message = (
            "المشروع كما هو مصمم لن يحقق ربحية مستدامة. التوصية: لا تستثمر "
            "دون إعادة هيكلة كاملة لمعطيات المشروع."
        )

    result = {
        "score":         score,
        "max_score":     max_score,
        "score_percent": round(score / max_score * 100, 1),
        "outcome":       outcome,
        "outcome_color": outcome_color,
        "outcome_emoji": outcome_emoji,
        "message":       message,
        "factors":       factors,
    }

    if language == "en":
        result = _translate_result_to_english(result)

    return result


# Arabic-to-English label mapping.
_AR_TO_EN = {
    "هامش الربح المستقر":                "Stable Profit Margin",
    "العائد على الاستثمار (3 سنوات)":     "Return on Investment (3 Years)",
    "فترة الاسترداد":                     "Payback Period",
    "كفاية الاحتياطي التشغيلي":           "Operating Cushion Adequacy",
    "فرصة السوق":                         "Market Opportunity",

    "ممتاز":                              "Excellent",
    "جيد جداً":                            "Very Good",
    "جيد (المعدل الطبيعي للقطاع)":         "Good (Sector Average)",
    "جيد (ضمن المتوقع للقطاع)":            "Good (Within Sector Expectations)",
    "جيد":                                 "Good",
    "مقبول":                               "Acceptable",
    "ضعيف لكن موجب":                       "Weak but Positive",
    "حدّي (قرب الصفر)":                    "Marginal (Near Zero)",
    "سلبي":                                "Negative",
    "ضعيف":                                "Weak",
    "بالكاد موجب":                         "Barely Positive",
    "خسارة صافية":                         "Net Loss",
    "ممتاز (استرداد + ضعف خلال 3 سنوات)":  "Excellent (Payback + Double in 3 Years)",
    "طويل لكن ممكن":                       "Long but Feasible",
    "طويل جداً":                           "Very Long",
    "غير عملي":                            "Impractical",
    "لا يحدث (الربح غير موجب)":            "Does Not Occur (Non-Positive Profit)",
    "ممتاز (السنة 1 رابحة)":               "Excellent (Year 1 Profitable)",
    "ممتاز (يغطي الخسائر بأمان)":          "Excellent (Safely Covers Losses)",
    "كافٍ بحدّ أدنى":                       "Minimally Sufficient",
    "غير كافٍ — خطر تعثّر":                "Insufficient — Risk of Default",
    "غير كافٍ على الإطلاق":                "Severely Insufficient",
    "غير محسوب":                           "Not Calculated",
    "متوسط":                               "Moderate",
    "ضعيف (سوق مشبع/ضعيف الطلب)":          "Weak (Saturated / Low Demand)",
    "غير محدّد (افتراضي)":                  "Undefined (Default)",

    "نجاح مرتفع":            "High Success",
    "نجاح محتمل":            "Probable Success",
    "مخاطرة متوسطة":         "Moderate Risk",
    "مخاطرة عالية":          "High Risk",
    "احتمال فشل عالي":       "High Failure Probability",

    "غير مطلوب":            "Not Required",
    "—":                    "—",
}


def _translate_value_string(s: str) -> str:
    """Translate a value string that mixes Arabic words with numbers
    (for example: 18 شهر, or احتياطي 30,000 مقابل خسارة 12,000).

    Replaces only known Arabic tokens; the digits remain intact. Order
    matters: full phrases are replaced before single words to avoid
    breaking longer matches.
    """
    if not isinstance(s, str):
        return s
    out = s
    phrases = [
        ("غير مطلوب",  "Not Required"),
        ("غير محسوب",  "Not Calculated"),
    ]
    for ar, en in phrases:
        out = out.replace(ar, en)
    contextual = {
        "شهر":      "months",
        "احتياطي":   "Cushion",
        "مقابل":     "vs",
        "خسارة":     "Loss",
    }
    for ar, en in contextual.items():
        out = out.replace(ar, en)
    return out


def _translate_result_to_english(result: dict) -> dict:
    """Translate every Arabic string inside the predictor result to English."""
    result["outcome"] = _AR_TO_EN.get(result["outcome"], result["outcome"])

    outcome_messages_en = {
        "High Success": (
            "All indicators support project success. Disciplined execution of the financial "
            "and operational plan is expected to deliver the targeted return within the projected timeframe."
        ),
        "Probable Success": (
            "The project is promising but requires close monthly monitoring of KPIs and readiness "
            "to adjust the plan when actual results diverge from targets."
        ),
        "Moderate Risk": (
            "The project is viable but requires substantial improvements before launch — such as "
            "restructuring costs, raising prices, or reducing headcount."
        ),
        "High Risk": (
            "Current indicators are weak. A substantial review of the economic model "
            "(costs, pricing, team size) is advised before committing to any investment."
        ),
        "High Failure Probability": (
            "The project as designed will not achieve sustainable profitability. "
            "Recommendation: do not invest without a full restructuring of the project's economics."
        ),
    }
    result["message"] = outcome_messages_en.get(result["outcome"], result["message"])

    for factor in result.get("factors", []):
        factor["name"]   = _AR_TO_EN.get(factor["name"],   factor["name"])
        factor["rating"] = _AR_TO_EN.get(factor["rating"], factor["rating"])
        factor["value"]  = _translate_value_string(factor["value"])

    return result
