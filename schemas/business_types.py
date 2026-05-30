
BUSINESS_TYPES = {
    "pizza_restaurant":       {"label_ar": "مطعم بيتزا",        "label_en": "Pizza Restaurant",        "google_type": "pizza_restaurant"},
    "fast_food_restaurant":   {"label_ar": "وجبات سريعة",       "label_en": "Fast Food",                "google_type": "fast_food_restaurant"},
    "cafe":                   {"label_ar": "كافيه",              "label_en": "Cafe",                    "google_type": "cafe"},
    "seafood_restaurant":     {"label_ar": "مأكولات بحرية",     "label_en": "Seafood Restaurant",      "google_type": "seafood_restaurant"},
    "breakfast_restaurant":   {"label_ar": "فطور",               "label_en": "Breakfast Restaurant",    "google_type": "breakfast_restaurant"},
    "sandwich_shop":          {"label_ar": "ساندويتش",           "label_en": "Sandwich Shop",           "google_type": "sandwich_shop"},
    "shawarma_restaurant":    {"label_ar": "شاورما",             "label_en": "Shawarma Restaurant",     "google_type": "restaurant"},
    "traditional_restaurant": {"label_ar": "مطعم شعبي / مندي",  "label_en": "Traditional Restaurant",  "google_type": "restaurant"},
    "restaurant":             {"label_ar": "مطعم عام",           "label_en": "General Restaurant",      "google_type": "restaurant"},
}

def get_google_type(business_type: str) -> str:
    """يرجع النوع المستخدم في قوقل بلايسز (للبحث عن المنافسين)"""
    return BUSINESS_TYPES.get(business_type, {}).get("google_type", "restaurant")

def get_label_ar(business_type: str) -> str:
    """يرجع الاسم بالعربي (للعرض في الـ PDF والـ UI)"""
    return BUSINESS_TYPES.get(business_type, {}).get("label_ar", business_type)

def get_label_en(business_type: str) -> str:
    """يرجع الاسم بالإنجليزي (للعرض في الـ PDF والـ UI لما اللغة المختارة 'en')"""
    return BUSINESS_TYPES.get(business_type, {}).get("label_en", business_type)

def get_label(business_type: str, language: str = "ar") -> str:
    """يرجع الاسم باللغة المطلوبة. مفيد لما تكون عندنا قيمة language ديناميكية."""
    return get_label_en(business_type) if language == "en" else get_label_ar(business_type)

def is_valid_type(business_type: str) -> bool:
    """تحقق من إن النوع مدعوم (يستخدم للتحقق من المدخلات)"""
    return business_type in BUSINESS_TYPES