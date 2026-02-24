# decision_engine.py

from saudi_assumptions import (
    STRONG_PROFIT_MARGIN,
    MODERATE_PROFIT_MARGIN,
    GOOD_PAYBACK_MONTHS,
    ACCEPTABLE_PAYBACK_MONTHS
)

def classify_project(profit_margin_percent: float, payback_months):
    """
    Returns:
      - classification (str)
      - score (int)
      - reasons (list[str]) short explainable points
    """

    score = 0
    reasons = []

    # Profit Margin scoring
    profit_margin = profit_margin_percent / 100.0
    if profit_margin >= STRONG_PROFIT_MARGIN:
        score += 2
        reasons.append("Profit margin is strong.")
    elif profit_margin >= MODERATE_PROFIT_MARGIN:
        score += 1
        reasons.append("Profit margin is moderate.")
    else:
        reasons.append("Profit margin is low.")

    # Payback scoring
    if payback_months is None:
        reasons.append("Payback period cannot be computed (profit is not positive).")
    else:
        if payback_months <= GOOD_PAYBACK_MONTHS:
            score += 2
            reasons.append("Payback period is excellent.")
        elif payback_months <= ACCEPTABLE_PAYBACK_MONTHS:
            score += 1
            reasons.append("Payback period is acceptable.")
        else:
            reasons.append("Payback period is long (higher risk).")

    # Final classification
    if score >= 3:
        classification = "Suitable for Investment"
    elif score == 2:
        classification = "Moderate Risk"
    else:
        classification = "High Risk"

    return {
        "classification": classification,
        "score": score,
        "reasons": reasons
    }
# decision_engine.py

from saudi_assumptions import (
    STRONG_PROFIT_MARGIN,
    MODERATE_PROFIT_MARGIN,
    GOOD_PAYBACK_MONTHS,
    ACCEPTABLE_PAYBACK_MONTHS
)

def classify_project(profit_margin_percent: float, payback_months):
    """
    Returns:
      - classification (str)
      - score (int)
      - reasons (list[str]) short explainable points
    """

    score = 0
    reasons = []

    # Profit Margin scoring
    profit_margin = profit_margin_percent / 100.0
    if profit_margin >= STRONG_PROFIT_MARGIN:
        score += 2
        reasons.append("Profit margin is strong.")
    elif profit_margin >= MODERATE_PROFIT_MARGIN:
        score += 1
        reasons.append("Profit margin is moderate.")
    else:
        reasons.append("Profit margin is low.")

    # Payback scoring
    if payback_months is None:
        reasons.append("Payback period cannot be computed (profit is not positive).")
    else:
        if payback_months <= GOOD_PAYBACK_MONTHS:
            score += 2
            reasons.append("Payback period is excellent.")
        elif payback_months <= ACCEPTABLE_PAYBACK_MONTHS:
            score += 1
            reasons.append("Payback period is acceptable.")
        else:
            reasons.append("Payback period is long (higher risk).")

    # Final classification
    if score >= 3:
        classification = "Suitable for Investment"
    elif score == 2:
        classification = "Moderate Risk"
    else:
        classification = "High Risk"

    return {
        "classification": classification,
        "score": score,
        "reasons": reasons
    }
