# =====================================================================
# test_unit.py — Unit Tests for Muqaddim Platform
# Tests individual functions in isolation.
# Each test verifies a single piece of logic without external dependencies.
# =====================================================================

from core.validators import validate_feasibility_input
from data.saudi_assumptions import calculate_capital_allocation
from engines.success_predictor import predict_project_outcome


# =====================================================================
# Helper — Baseline of valid input shared across validator tests.
# Marked private (underscore) so pytest does not run it as a test.
# =====================================================================
def _valid_input():
    return {
        "capital":           100000,
        "rent":              5000,
        "employees":         3,
        "avg_price":         30,
        "customers_per_day": 50,
        "lat":               24.7136,
        "lng":               46.6753,
    }


# =====================================================================
# Validator Tests — Defense-in-Depth at the API layer
# =====================================================================

def test_valid_input_passes():
    """Happy Path: well-formed input is accepted by the validator."""
    is_valid, error = validate_feasibility_input(_valid_input())
    assert is_valid is True
    assert error == ""


def test_negative_capital_is_rejected():
    """Defense-in-Depth: negative capital is rejected with an Arabic error."""
    data = _valid_input()
    data["capital"] = -50000
    is_valid, error = validate_feasibility_input(data)
    assert is_valid is False
    assert "رأس المال" in error


def test_non_numeric_value_is_rejected():
    """Type Safety: non-numeric strings in numeric fields are rejected."""
    data = _valid_input()
    data["avg_price"] = "abc"
    is_valid, error = validate_feasibility_input(data)
    assert is_valid is False
    assert "رقم" in error or "متوسط سعر المنتج" in error


# =====================================================================
# Math Integrity Test — Capital Allocation
# =====================================================================

def test_capital_allocation_sums_to_capital():
    """Math Integrity: sum of allocations must equal the original capital."""
    result = calculate_capital_allocation("cafe", 100000)
    total_allocated = sum(item["amount"] for item in result["allocation"])
    assert abs(total_allocated - 100000) < 1   # tolerate < 1 SAR rounding


# =====================================================================
# Edge Case Test — Success Predictor with Loss-making Project
# =====================================================================

def test_payback_none_gives_zero_points():
    """Edge Case: when project never reaches payback, factor scores 0 points."""
    result = predict_project_outcome(
        financials={
            "profit_margin_percent": 5,
            "roi_3_year_percent":    10,
            "payback_period_months": None,
            "year_1_total_profit":   1000,
        },
        
    )
    payback_factor = next(f for f in result["factors"]
                           if f["name"] == "فترة الاسترداد")
    assert payback_factor["score"] == 0
