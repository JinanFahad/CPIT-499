# Financial projections, profitability, and payback calculations.
from data.saudi_assumptions import (
    DEFAULT_COGS,
    UTILITIES_RATE,
    OVERHEAD_RATE,
    MARKETING_RATE,
    YEARLY_REVENUE_GROWTH,
    YEARLY_COST_INFLATION,
    calculate_staff_salaries,
    calculate_capital_allocation,
)
from engines.success_predictor import predict_project_outcome

# Ramp-up assumptions
RAMP_UP_MONTHS = 6
RAMP_UP_START = 0.5

# Maximum payback period considered (months)
PAYBACK_MAX_MONTHS = 120

# Multi-year projection horizon
PROJECTION_YEARS = 3


def _ramp_factor(month: int) -> float:
    """Return the revenue ramp factor for a given month (1.0 = steady-state)."""
    if month >= RAMP_UP_MONTHS:
        return 1.0
    return RAMP_UP_START + (1.0 - RAMP_UP_START) * (month - 1) / (RAMP_UP_MONTHS - 1)


def calculate_financials(data, language: str = "ar"):
    """Compute every financial metric for a project and return them as a dict.

    Raises:
        ValueError: when an input is missing, non-numeric, or out of range.
    """
    if not isinstance(data, dict):
        raise ValueError("data must be a dict")

    business_type = data.get("business_type", "restaurant")
    if not isinstance(business_type, str) or not business_type:
        raise ValueError("business_type must be a non-empty string")

    def _to_float(value, field_name, allow_none=False, default=0.0, min_value=None):
        if value is None or value == "":
            if allow_none:
                return default
            raise ValueError(f"{field_name} is required")
        try:
            result = float(value)
        except (ValueError, TypeError) as e:
            raise ValueError(f"{field_name} must be a number, got: {value!r}") from e
        if min_value is not None and result < min_value:
            raise ValueError(f"{field_name} must be >= {min_value}, got {result}")
        return result

    def _to_int(value, field_name, allow_none=False, default=0, min_value=None):
        if value is None or value == "":
            if allow_none:
                return default
            raise ValueError(f"{field_name} is required")
        try:
            result = int(float(value))
        except (ValueError, TypeError) as e:
            raise ValueError(f"{field_name} must be an integer, got: {value!r}") from e
        if min_value is not None and result < min_value:
            raise ValueError(f"{field_name} must be >= {min_value}, got {result}")
        return result

    if "capital" not in data:
        raise ValueError("capital is required")
    capital = _to_float(data["capital"], "capital", min_value=1)
    rent = _to_float(data.get("rent"), "rent", allow_none=True, min_value=0)
    employees = _to_int(data.get("employees"), "employees", allow_none=True, min_value=0)
    avg_price = _to_float(data.get("avg_price"), "avg_price", allow_none=True, min_value=0)
    customers_per_day = _to_float(data.get("customers_per_day"), "customers_per_day",
                                  allow_none=True, min_value=0)


    if avg_price * customers_per_day == 0:
        import logging
        logging.getLogger(__name__).warning(
            "calculate_financials: avg_price (%s) x customers_per_day (%s) = 0",
            avg_price, customers_per_day,
        )

    if data.get("cogs_known") and data.get("cogs_percent") not in (None, ""):
        cogs_rate = _to_float(data["cogs_percent"], "cogs_percent", min_value=0) / 100
        if cogs_rate >= 1:
            raise ValueError(f"cogs_percent must be < 100 (got {cogs_rate * 100})")
    else:
        cogs_rate = DEFAULT_COGS.get(business_type, 0.40)

    steady_daily_revenue = avg_price * customers_per_day
    steady_monthly_revenue = steady_daily_revenue * 28


    staff = calculate_staff_salaries(employees)
    salaries = staff["total"]
    salary_breakdown = staff["breakdown"]
    fixed_monthly_costs = rent + salaries

    variable_cost_rate = (
        cogs_rate +
        UTILITIES_RATE +
        OVERHEAD_RATE +
        MARKETING_RATE
    )

    def project_month(month_num: int) -> dict:
        """Compute one month's revenue, expenses, and profit.

        Year 1 (months 1-12) applies the ramp-up curve with no inflation.
        Year 2 (months 13-24) scales revenue by +growth% and fixed costs by
        +inflation%. Year 3 compounds the same factors a second time.
        """
        year_index = (month_num - 1) // 12

        if year_index == 0:
            ramp = _ramp_factor(month_num)
            revenue = steady_monthly_revenue * ramp
            inflated_fixed = fixed_monthly_costs
            display_pct = round(ramp * 100)
        else:
            growth   = (1 + YEARLY_REVENUE_GROWTH) ** year_index
            inflate  = (1 + YEARLY_COST_INFLATION) ** year_index
            revenue  = steady_monthly_revenue * growth
            inflated_fixed = fixed_monthly_costs * inflate
            display_pct = round(growth * 100)

        variable_costs = revenue * variable_cost_rate
        expenses = inflated_fixed + variable_costs
        profit   = revenue - expenses

        return {
            "month":         month_num,
            "year":          year_index + 1,
            "ramp_percent":  display_pct,
            "revenue":       round(revenue, 2),
            "expenses":      round(expenses, 2),
            "net_profit":    round(profit, 2),
        }

    full_projection = [project_month(m) for m in range(1, PROJECTION_YEARS * 12 + 1)]
    monthly_projection = full_projection[:12]

    steady = project_month(RAMP_UP_MONTHS)
    monthly_revenue   = steady["revenue"]
    monthly_expenses  = steady["expenses"]
    net_profit        = steady["net_profit"]
    profit_margin     = (net_profit / monthly_revenue) if monthly_revenue > 0 else 0

    month_1 = monthly_projection[0]

    year_1_total_revenue  = sum(m["revenue"] for m in monthly_projection)
    year_1_total_expenses = sum(m["expenses"] for m in monthly_projection)
    year_1_total_profit   = sum(m["net_profit"] for m in monthly_projection)


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
            "cumulative_roi_pct": round(cumulative_so_far / capital * 100, 2) if capital > 0 else 0,
        })


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

    total_3_year_profit = yearly_summary[-1]["cumulative_profit"]
    roi_3_year_percent = round(total_3_year_profit / capital * 100, 2) if capital > 0 else 0

   # Calculate break-even revenue.
    break_even_revenue = (
        fixed_monthly_costs / (1 - variable_cost_rate)
        if variable_cost_rate < 1 else 0
    )

    # Find the break-even month.
    break_even_month = None
    for m in monthly_projection:
        if m["revenue"] >= break_even_revenue:
            break_even_month = m["month"]
            break

    # Calculate payback period from cumulative cash flow.
    payback_months = None
    cumulative = 0.0
    for month in range(1, PAYBACK_MAX_MONTHS + 1):
        m_data = project_month(month)
        cumulative += m_data["net_profit"]
        if cumulative >= capital:
            payback_months = month
            break

    # Generate capital allocation by business type.
    capital_breakdown = calculate_capital_allocation(business_type, capital)

    # Generate the project success prediction.
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
        language=language,
    )

    # Steady-state cost breakdown
    cogs_steady      = monthly_revenue * cogs_rate
    utilities_steady = monthly_revenue * UTILITIES_RATE
    overhead_steady  = monthly_revenue * OVERHEAD_RATE
    marketing_steady = monthly_revenue * MARKETING_RATE

    return {
        # Key financial metrics
        "monthly_revenue":         round(monthly_revenue, 2),
        "monthly_expenses":        round(monthly_expenses, 2),
        "monthly_net_profit":      round(net_profit, 2),
        "profit_margin_percent":   round(profit_margin * 100, 2),
        "break_even_revenue":      round(break_even_revenue, 2),
        "payback_period_months":   payback_months,

        # Year 1 projection metrics
        "month_1_revenue":         month_1["revenue"],
        "month_1_net_profit":      month_1["net_profit"],
        "break_even_month":        break_even_month,
        "monthly_projection":      monthly_projection,
        "year_1_total_revenue":    round(year_1_total_revenue, 2),
        "year_1_total_expenses":   round(year_1_total_expenses, 2),
        "year_1_total_profit":     round(year_1_total_profit, 2),
        "ramp_up_months":          RAMP_UP_MONTHS,

        # Cost breakdown
        "salaries_total":          round(salaries, 2),
        "salary_breakdown":        salary_breakdown,
        "utilities_cost":          round(utilities_steady, 2),
        "overhead_cost":           round(overhead_steady, 2),
        "marketing_cost":          round(marketing_steady, 2),
        "cogs_cost":               round(cogs_steady, 2),

        # Three-year projection
        "yearly_summary":          yearly_summary,
        "cumulative_profit_curve": cumulative_profit_curve,
        "total_3_year_profit":     round(total_3_year_profit, 2),
        "roi_3_year_percent":      roi_3_year_percent,
        "yearly_revenue_growth":   YEARLY_REVENUE_GROWTH,
        "yearly_cost_inflation":   YEARLY_COST_INFLATION,

        # Legacy yearly revenue fields
        "year_1_revenue":          yearly_summary[0]["revenue"],
        "year_2_revenue":          yearly_summary[1]["revenue"],
        "year_3_revenue":          yearly_summary[2]["revenue"],

        "funding_needed":          round(capital, 2),

        # Capital allocation and success prediction
        "capital_allocation":      capital_breakdown["allocation"],
        "operating_cushion":       capital_breakdown["cushion_amount"],
        "success_prediction":      success_prediction,

        # Original user inputs
        "inputs_summary": {
            "capital":           round(capital, 2),
            "rent":              round(rent, 2),
            "employees":         employees,
            "avg_price":         round(avg_price, 2),
            "customers_per_day": round(customers_per_day, 2),
            "business_type":     business_type,
        },
    }
