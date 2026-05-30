# Saudi market assumptions and constants

DEFAULT_SALARY = 5000

# Staff salary tiers
STAFF_SALARY_TIERS = [
    {"role": "chef",             "role_ar": "شيف",          "role_en": "Chef",             "salary": 5000},
    {"role": "assistant_chef",   "role_ar": "مساعد شيف",    "role_en": "Assistant Chef",   "salary": 3000},
    {"role": "cashier",          "role_ar": "كاشير",        "role_en": "Cashier",          "salary": 3000},
    {"role": "customer_service", "role_ar": "خدمة عملاء",   "role_en": "Customer Service", "salary": 2500},
    {"role": "cleaner",          "role_ar": "عامل نظافة",   "role_en": "Cleaner",          "salary": 1750},
]

# Extra hire allocation order
_EXTRA_HIRE_ORDER = ["cleaner", "customer_service", "cashier"]


def calculate_staff_salaries(employees: int) -> dict:
    """يوزّع عدد الموظفين على الأدوار ويرجع الإجمالي + التفصيل.

    مثال (٣ موظفين): شيف + مساعد + كاشير = 11,000 ر.س
    مثال (٨ موظفين): الـ٥ أدوار + ٢ نظافة إضافي + ١ خدمة عملاء = 22,500 ر.س
    """
    if not employees or employees <= 0:
        return {"total": 0, "breakdown": []}

    employees = int(employees)
    counts = {tier["role"]: 0 for tier in STAFF_SALARY_TIERS}

    # Assign one employee per role first
    initial = min(employees, len(STAFF_SALARY_TIERS))
    for i in range(initial):
        counts[STAFF_SALARY_TIERS[i]["role"]] = 1

    # Allocate additional hires to support roles
    extras = employees - len(STAFF_SALARY_TIERS)
    for i in range(max(extras, 0)):
        role = _EXTRA_HIRE_ORDER[i % len(_EXTRA_HIRE_ORDER)]
        counts[role] += 1

    total = 0
    breakdown = []
    for tier in STAFF_SALARY_TIERS:
        count = counts[tier["role"]]
        if count > 0:
            subtotal = count * tier["salary"]
            total += subtotal
            breakdown.append({
                "role":     tier["role"],
                "role_ar":  tier["role_ar"],
                "role_en":  tier["role_en"],
                "count":    count,
                "salary":   tier["salary"],
                "subtotal": subtotal,
            })

    return {"total": total, "breakdown": breakdown}

# Default COGS by business type
DEFAULT_COGS = {
    "cafe":                   0.30,  
    "pizza_restaurant":       0.32,
    "fast_food_restaurant":   0.32,  
    "sandwich_shop":          0.32,
    "shawarma_restaurant":    0.32,
    "breakfast_restaurant":   0.32,
    "traditional_restaurant": 0.33,
    "restaurant":             0.33,  
    "seafood_restaurant":     0.35,  
    "Cafe":                   0.30,
    "Restaurant":             0.33,
    "FastFood":               0.32,
}

VAT_RATE = 0.15

STRONG_PROFIT_MARGIN = 0.15

MODERATE_PROFIT_MARGIN = 0.07

GOOD_PAYBACK_MONTHS = 24

ACCEPTABLE_PAYBACK_MONTHS = 48

UTILITIES_RATE = 0.06   
OVERHEAD_RATE  = 0.03   
MARKETING_RATE = 0.03   

YEARLY_REVENUE_GROWTH = 0.10 
YEARLY_COST_INFLATION = 0.05 


# Capital allocation assumptions based on industry benchmarks
CAPITAL_ALLOCATION = {
    "cafe": {
        "equipment": 0.25, 
        "decor":     0.22,  
        "deposit":   0.12, 
        "licenses":  0.07,
        "inventory": 0.06, 
        "marketing": 0.10, 
        "cushion":   0.18,
    },
    "restaurant": {
        "equipment": 0.30,
        "decor":     0.18,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.08,
        "marketing": 0.07,
        "cushion":   0.18,
    },
    "fast_food_restaurant": {
        "equipment": 0.32, 
        "decor":     0.13,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.10, 
        "marketing": 0.08,
        "cushion":   0.18,
    },
    "pizza_restaurant": {
        "equipment": 0.35, 
        "decor":     0.13,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.08,
        "marketing": 0.07,
        "cushion":   0.18,
    },
    "shawarma_restaurant": {
        "equipment": 0.28, 
        "decor":     0.15,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.10,
        "marketing": 0.08,
        "cushion":   0.20,
    },
    "seafood_restaurant": {
        "equipment": 0.28, 
        "decor":     0.20, 
        "deposit":   0.13,
        "licenses":  0.08,
        "inventory": 0.10, 
        "marketing": 0.06,
        "cushion":   0.15,
    },
}

CAPITAL_ALLOCATION_DEFAULT = {
    "equipment": 0.30,
    "decor":     0.17,
    "deposit":   0.12,
    "licenses":  0.07,
    "inventory": 0.08,
    "marketing": 0.07,
    "cushion":   0.19,
}

CAPITAL_ALLOCATION_LABELS = {
    "equipment": {"ar": "معدات وأجهزة",      "en": "Equipment"},
    "decor":     {"ar": "تجهيزات وديكور",     "en": "Furniture & Decor"},
    "deposit":   {"ar": "عربون الإيجار",      "en": "Rent Deposit"},
    "licenses":  {"ar": "تراخيص وتأسيس",      "en": "Licenses & Setup"},
    "inventory": {"ar": "مخزون أولي",         "en": "Initial Inventory"},
    "marketing": {"ar": "تسويق وافتتاح",      "en": "Marketing & Launch"},
    "cushion":   {"ar": "احتياطي تشغيلي",     "en": "Operating Cushion"},
}


def calculate_capital_allocation(business_type: str, capital: float) -> dict:
    """يوزّع رأس المال على بنود التأسيس بناءً على نوع المشروع.

    يرجع:
        - allocation: قائمة بكل بند (key, label_ar, percent, amount)
        - cushion_amount: مبلغ الاحتياطي التشغيلي تحديداً (يُستخدم لاحقاً للمقارنة بخسائر السنة 1)
    """
    rates = CAPITAL_ALLOCATION.get(business_type, CAPITAL_ALLOCATION_DEFAULT)
    allocation = []
    for key, pct in rates.items():
        amount = capital * pct
        allocation.append({
            "key":      key,
            "label_ar": CAPITAL_ALLOCATION_LABELS[key]["ar"],
            "label_en": CAPITAL_ALLOCATION_LABELS[key]["en"],
            "percent":  round(pct * 100, 1),
            "amount":   round(amount, 2),
        })
    cushion_amount = round(capital * rates["cushion"], 2)
    return {
        "allocation":     allocation,
        "cushion_amount": cushion_amount,
    }












