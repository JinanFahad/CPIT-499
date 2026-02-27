
BUSINESS_TYPES = {
    "pizza_restaurant":       {"label_ar": "مطعم بيتزا",        "google_type": "pizza_restaurant"},
    "fast_food_restaurant":   {"label_ar": "وجبات سريعة",       "google_type": "fast_food_restaurant"},
    "cafe":                   {"label_ar": "كافيه",              "google_type": "cafe"},
    "seafood_restaurant":     {"label_ar": "مأكولات بحرية",     "google_type": "seafood_restaurant"},
    "breakfast_restaurant":   {"label_ar": "فطور",               "google_type": "breakfast_restaurant"},
    "sandwich_shop":          {"label_ar": "ساندويتش",           "google_type": "sandwich_shop"},
    "shawarma_restaurant":    {"label_ar": "شاورما",             "google_type": "restaurant"},
    "traditional_restaurant": {"label_ar": "مطعم شعبي / مندي",  "google_type": "restaurant"},
    "restaurant":             {"label_ar": "مطعم عام",           "google_type": "restaurant"},
}

def get_google_type(business_type: str) -> str:
    return BUSINESS_TYPES.get(business_type, {}).get("google_type", "restaurant")

def get_label_ar(business_type: str) -> str:
    return BUSINESS_TYPES.get(business_type, {}).get("label_ar", business_type)

def is_valid_type(business_type: str) -> bool:
    return business_type in BUSINESS_TYPES