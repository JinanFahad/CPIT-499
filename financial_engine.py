from saudi_assumptions import DEFAULT_COGS, DEFAULT_SALARY

def calculate_financials(data):

    business_type = data["business_type"]
    capital = float(data["capital"])
    rent = float(data["rent"])
    employees = int(data["employees"])
    avg_price = float(data["avg_price"])
    customers_per_day = float(data["customers_per_day"])

    avg_salary = float(data.get("avg_salary") or DEFAULT_SALARY)

    # COGS
    if data.get("cogs_known") and data.get("cogs_percent"):
        cogs_rate = float(data["cogs_percent"]) / 100
    else:
        cogs_rate = DEFAULT_COGS.get(business_type, 0.40)

    daily_revenue = avg_price * customers_per_day
    monthly_revenue = daily_revenue * 30

    salaries = employees * avg_salary
    fixed_costs = rent + salaries

    cogs = monthly_revenue * cogs_rate
    total_expenses = fixed_costs + cogs

    net_profit = monthly_revenue - total_expenses
    profit_margin = (net_profit / monthly_revenue) if monthly_revenue > 0 else 0

    break_even_revenue = fixed_costs / (1 - cogs_rate)
    payback_months = capital / net_profit if net_profit > 0 else None

    return {
        "monthly_revenue": round(monthly_revenue, 2),
        "monthly_expenses": round(total_expenses, 2),
        "monthly_net_profit": round(net_profit, 2),
        "profit_margin_percent": round(profit_margin * 100, 2),
        "break_even_revenue": round(break_even_revenue, 2),
"payback_period_months": round(payback_months, 2) if payback_months is not None else None    }
