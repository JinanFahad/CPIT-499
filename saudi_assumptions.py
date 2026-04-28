# =====================================================================
# saudi_assumptions.py — كل الثوابت والافتراضات للسوق السعودي
# نضعها في ملف واحد عشان نقدر نعدّلها بسهولة بدون ما نلمس الكود
# =====================================================================

# =========================
# 🇸🇦 Saudi Market Defaults
# =========================

# متوسط راتب موظف مطعم/كافيه (ريال) — يُستخدم كقيمة احتياطية فقط
DEFAULT_SALARY = 5000

# هيكل الأدوار في المطعم/الكافيه مرتّب بأولوية التعيين.
# أول ٥ موظفين: واحد لكل دور (شيف، مساعد، كاشير، خدمة عملاء، نظافة).
# بعد الـ ٥: الموظفين الإضافيين يكونون عمالة دعم فقط (نظافة/خدمة/كاشير)
# وما يُكرَّر الشيف أو المساعد لأن المطعم الواحد ما يحتاج عادةً أكثر من شيف.
STAFF_SALARY_TIERS = [
    {"role": "chef",             "role_ar": "شيف",          "salary": 5000},
    {"role": "assistant_chef",   "role_ar": "مساعد شيف",    "salary": 3000},
    {"role": "cashier",          "role_ar": "كاشير",        "salary": 3000},
    {"role": "customer_service", "role_ar": "خدمة عملاء",   "salary": 2500},
    {"role": "cleaner",          "role_ar": "عامل نظافة",   "salary": 1750},
]

# ترتيب توزيع الموظفين الإضافيين بعد أول ٥ — يدور بينهم بالتسلسل
# (نظافة أولاً لأنها الأقل تكلفة والأكثر طلباً مع توسع المشروع)
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

    # أول ٥ (أو أقل): واحد لكل دور بحسب الترتيب
    initial = min(employees, len(STAFF_SALARY_TIERS))
    for i in range(initial):
        counts[STAFF_SALARY_TIERS[i]["role"]] = 1

    # الزيادة بعد ٥: تدور على أدوار الدعم فقط (نظافة → خدمة → كاشير)
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
                "count":    count,
                "salary":   tier["salary"],
                "subtotal": subtotal,
            })

    return {"total": total, "breakdown": breakdown}

# نسبة تكلفة المواد حسب نوع النشاط (Food Cost / COGS)
# المعايير الصحية في قطاع المطاعم: 28-35% — أعلى من ذلك يعتبر هدر أو تسعير ضعيف
DEFAULT_COGS = {
    "cafe":                   0.30,  # مشروبات COGS قليل
    "pizza_restaurant":       0.32,
    "fast_food_restaurant":   0.32,  # كفاءة عالية وشراء بالجملة
    "sandwich_shop":          0.32,
    "shawarma_restaurant":    0.32,
    "breakfast_restaurant":   0.32,
    "traditional_restaurant": 0.33,
    "restaurant":             0.33,  # افتراضي عام
    "seafood_restaurant":     0.35,  # مواد فاخرة وعالية التكلفة
    # القيم القديمة للتوافق مع الكود السابق
    "Cafe":                   0.30,
    "Restaurant":             0.33,
    "FastFood":               0.32,
}

# ضريبة القيمة المضافة في السعودية
VAT_RATE = 0.15

# ============================================================
# عتبات التقييم — معايرة لقطاع المطاعم السعودي
# ============================================================
# الواقع: المطاعم في السعودية متوسط هامشها 5-15%، فترة استرداد 36-60 شهر
# المشاريع المثالية (15%+ هامش، 24- شهر استرداد) نادرة جداً
# لذا نخفّض العتبات لتعكس الواقع الفعلي للقطاع

# هامش ربح "قوي" في قطاع المطاعم السعودي (كان 20% — غير واقعي)
STRONG_PROFIT_MARGIN = 0.15

# هامش ربح "متوسط" / مقبول (كان 10% — صارم)
MODERATE_PROFIT_MARGIN = 0.07

# مدة استرداد "ممتازة" بالأشهر (كان 12 — استثنائي وغير واقعي للمطاعم)
GOOD_PAYBACK_MONTHS = 24

# مدة استرداد "مقبولة" (كان 24 — صارم لقطاع المطاعم)
ACCEPTABLE_PAYBACK_MONTHS = 48

# Additional Monthly Operating Costs (تكاليف تشغيلية شهرية، نسبة من الإيراد)
UTILITIES_RATE = 0.06   # 6% — مرافق (كهرباء، ماء، إنترنت)
OVERHEAD_RATE  = 0.03   # 3% — تشغيل عام (صيانة، أدوات)
MARKETING_RATE = 0.03   # 3% — تسويق وإعلانات

# نمو متعدد السنوات (للتوقعات السنة 2 و 3)
YEARLY_REVENUE_GROWTH = 0.10  # 10% نمو سنوي للإيراد (مع توسع قاعدة العملاء)
YEARLY_COST_INFLATION = 0.05  # 5% تضخم سنوي للرواتب والإيجار


# =====================================================================
# توزيع رأس المال على بنود التأسيس
# =====================================================================
# النسب تختلف حسب نوع المشروع:
# - الكافيه: ديكور مهم (تجربة العميل) ومعدات أقل تكلفة
# - الفاست فود: معدات عالية التكلفة (مقالي، شوايات) وديكور بسيط
# - البيتزا: فرن بيتزا غالي جداً
# - الفود ترك: لا يوجد عربون إيجار، لكن تكلفة العربة عالية
# المرجع: ممارسات مكاتب دراسات الجدوى السعودية + تقارير غرفة جدة

CAPITAL_ALLOCATION = {
    "cafe": {
        "equipment": 0.25,  # ماكينات قهوة + ثلاجات
        "decor":     0.22,  # الديكور حاسم لتجربة الكافيه
        "deposit":   0.12,  # عربون 3-4 شهور
        "licenses":  0.07,
        "inventory": 0.06,  # حبوب قهوة + معجنات
        "marketing": 0.10,  # افتتاحية مهمة لجذب الزبائن
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
        "equipment": 0.32,  # مقالي عميقة + شوايات + برّاد
        "decor":     0.13,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.10,  # مخزون متنوع
        "marketing": 0.08,
        "cushion":   0.18,
    },
    "pizza_restaurant": {
        "equipment": 0.35,  # فرن بيتزا حجري/كهربائي مكلف
        "decor":     0.13,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.08,
        "marketing": 0.07,
        "cushion":   0.18,
    },
    "shawarma_restaurant": {
        "equipment": 0.28,  # سيخ شاورما + ثلاجات
        "decor":     0.15,
        "deposit":   0.12,
        "licenses":  0.07,
        "inventory": 0.10,
        "marketing": 0.08,
        "cushion":   0.20,
    },
    "seafood_restaurant": {
        "equipment": 0.28,  # ثلاجات تخصصية للأسماك
        "decor":     0.20,  # ديكور أنيق للمأكولات البحرية
        "deposit":   0.13,
        "licenses":  0.08,
        "inventory": 0.10,  # مخزون عالي التكلفة
        "marketing": 0.06,
        "cushion":   0.15,
    },
}

# قيم افتراضية لأي نوع مشروع غير محدد أعلاه
CAPITAL_ALLOCATION_DEFAULT = {
    "equipment": 0.30,
    "decor":     0.17,
    "deposit":   0.12,
    "licenses":  0.07,
    "inventory": 0.08,
    "marketing": 0.07,
    "cushion":   0.19,
}

# تسميات البنود بالعربية والإنجليزية لعرضها في التقارير
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












