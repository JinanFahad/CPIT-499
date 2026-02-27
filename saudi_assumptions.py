# =========================
# 🇸🇦 Saudi Market Defaults
# =========================

# متوسط راتب موظف مطعم/كافيه (ريال)
DEFAULT_SALARY = 4000

# نسبة تكلفة المواد حسب نوع النشاط
DEFAULT_COGS = {
    "pizza_restaurant":       0.38,
    "fast_food_restaurant":   0.42,
    "cafe":                   0.35,
    "seafood_restaurant":     0.40,
    "breakfast_restaurant":   0.37,
    "sandwich_shop":          0.40,
    "shawarma_restaurant":    0.41,
    "traditional_restaurant": 0.39,
    "restaurant":             0.40,  # افتراضي عام
    # القيم القديمة للتوافق مع الكود السابق
    "Cafe":                   0.35,
    "Restaurant":             0.40,
    "FastFood":               0.45,
}

# ضريبة القيمة المضافة في السعودية
VAT_RATE = 0.15

# هامش ربح يعتبر قوي في قطاع المطاعم
STRONG_PROFIT_MARGIN = 0.20

# هامش ربح يعتبر متوسط
MODERATE_PROFIT_MARGIN = 0.10

# مدة استرداد ممتازة (بالأشهر)
GOOD_PAYBACK_MONTHS = 12

# مدة استرداد مقبولة
ACCEPTABLE_PAYBACK_MONTHS = 24














