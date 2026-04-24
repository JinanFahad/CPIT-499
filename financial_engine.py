from saudi_assumptions import (
    DEFAULT_COGS,
    DEFAULT_SALARY,
    UTILITIES_RATE,
    OVERHEAD_RATE,
    MARKETING_RATE
)

def calculate_financials(data):
    business_type = data.get("business_type", "restaurant")
    capital = float(data["capital"])
    rent = float(data.get("rent") or 0)
    employees = int(data.get("employees") or 0)
    avg_price = float(data.get("avg_price") or 0)
    customers_per_day = float(data.get("customers_per_day") or 0)

    avg_salary = float(data.get("avg_salary") or DEFAULT_SALARY)

    # COGS
    if data.get("cogs_known") and data.get("cogs_percent"):
        cogs_rate = float(data["cogs_percent"]) / 100
    else:
        cogs_rate = DEFAULT_COGS.get(business_type, 0.40)

    daily_revenue = avg_price * customers_per_day
    monthly_revenue = daily_revenue * 28

    utilities = monthly_revenue * UTILITIES_RATE
    overhead = monthly_revenue * OVERHEAD_RATE
    marketing = monthly_revenue * MARKETING_RATE

    salaries = employees * avg_salary
    cogs = monthly_revenue * cogs_rate

    fixed_costs = rent + salaries
    monthly_expenses = (
        rent +
        salaries +
        cogs +
        utilities +
        overhead +
        marketing
    )

    net_profit = monthly_revenue - monthly_expenses
    profit_margin = (net_profit / monthly_revenue) if monthly_revenue > 0 else 0

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

    payback_months = capital / net_profit if net_profit > 0 else None

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