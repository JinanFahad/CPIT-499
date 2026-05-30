
_FEASIBILITY_NUMERIC_FIELDS = {
    "capital":           {"min": 5000, "label_ar": "رأس المال"},
    "rent":              {"min": 1000, "label_ar": "الإيجار الشهري"},
    "employees":         {"min": 1,    "label_ar": "عدد الموظفين"},
    "avg_price":         {"min": 5,    "label_ar": "متوسط سعر المنتج"},
    "customers_per_day": {"min": 1,    "label_ar": "عدد العملاء اليومي"},
}


def validate_feasibility_input(data: dict) -> tuple[bool, str]:
    """يتحقق من مدخلات دراسة الجدوى.

    Args:
        data: الـ JSON المرسل من الفرونت

    Returns:
        (True, "") إذا المدخلات صحيحة
        (False, "رسالة خطأ بالعربي") إذا فيه مشكلة
    """
    if not isinstance(data, dict):
        return False, "البيانات المرسلة غير صحيحة"

    # Validate numeric fields
    for field, rules in _FEASIBILITY_NUMERIC_FIELDS.items():
        value = data.get(field)

        if value is None or value == "":
            return False, f"{rules['label_ar']} مطلوب"

        try:
            num_value = float(value)
        except (TypeError, ValueError):
            return False, f"{rules['label_ar']} يجب أن يكون رقماً"

        if num_value < rules["min"]:
            return False, (
                f"{rules['label_ar']} يجب أن يكون "
                f"{rules['min']} ر.س أو أكثر"
                if field in ("capital", "rent", "avg_price")
                else f"{rules['label_ar']} يجب أن يكون {rules['min']} أو أكثر"
            )

    lat = data.get("lat")
    lng = data.get("lng")

    if lat is not None and lat != "":
        try:
            lat_f = float(lat)
            if not -90 <= lat_f <= 90:
                return False, "إحداثي خط العرض (lat) خارج النطاق المسموح"
        except (TypeError, ValueError):
            return False, "إحداثيات الموقع غير صحيحة"

    if lng is not None and lng != "":
        try:
            lng_f = float(lng)
            if not -180 <= lng_f <= 180:
                return False, "إحداثي خط الطول (lng) خارج النطاق المسموح"
        except (TypeError, ValueError):
            return False, "إحداثيات الموقع غير صحيحة"

    return True, ""
