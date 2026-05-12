# =====================================================================
# report_labels.py — قاموس ثنائي اللغة لقالب تقرير دراسة الجدوى
# يحتوي على كل النصوص الثابتة (العناوين، اللابيلات، رؤوس الجداول)
# اللي يستخدمها report_template.html.
#
# الاستخدام:
#   from report_labels import get_labels
#   labels = get_labels("ar")  # أو "en"
#   template.render(labels=labels, ...)
# =====================================================================

# جميع المفاتيح مكتوبة بالإنجليزية لسهولة القراءة في القالب.
# القيم في كل قاموس هي الترجمة المعتمدة.

LABELS_AR = {
    # ── الغلاف ──
    "brand_caption":           "MUQADDIM · مقدّم",
    "cover_subtitle":          "دراسة جدوى المشروع",
    "cover_brand_top":         "منصة مُقدِّم للدراسات الاستثمارية",
    "badge_suitable":          "مناسب للاستثمار",
    "badge_moderate":          "مخاطرة متوسطة",
    "badge_risk":              "مخاطرة عالية",
    "cover_kpi_capital":       "رأس المال",
    "cover_kpi_revenue":       "الإيراد الشهري",
    "cover_kpi_margin":        "هامش الربح",
    "cover_kpi_payback":       "فترة الاسترداد",
    "month_unit":              "شهر",
    "sar_unit":                "ر.س",
    "percent_unit":            "%",

    # ── أقسام رئيسية ──
    "section_summary":         "الملخص التنفيذي ونظرة عامة على المشروع",
    "section_financial":       "التحليل المالي",
    "section_decision":        "القرار الاستثماري والمخاطر",
    "section_market":          "تحليل السوق",
    "section_next_steps":      "الخطوات القادمة",

    # ── الملخص التنفيذي ──
    "verdict":                 "التوصية:",
    "highlights":              "أبرز النقاط",
    "key_concern":             "أبرز مخاطرة",
    "key_opportunity":         "أبرز فرصة",

    # ── نظرة عامة على المشروع ──
    "business_type":           "نوع المشروع",
    "restaurant_type":         "النوع الفرعي",
    "city":                    "المدينة",
    "main_products":           "المنتجات الرئيسية",
    "target_customers":        "العملاء المستهدفون",
    "value_proposition":       "عرض القيمة",
    "expected_customers":      "العملاء المتوقعين يومياً",

    # ── KPIs المالية ──
    "monthly_revenue":         "الإيراد الشهري",
    "monthly_expenses":        "المصروفات الشهرية",
    "monthly_net_profit":      "صافي الربح الشهري",
    "profit_margin":           "هامش الربح",
    "payback_period":          "فترة الاسترداد",
    "break_even_revenue":      "نقطة التعادل",
    "break_even_month":        "شهر التعادل",

    # ── جدول المصاريف ──
    "expenses_breakdown":      "تفاصيل المصاريف الشهرية",
    "item":                    "البند",
    "amount_sar":              "المبلغ (ر.س)",
    "rent":                    "الإيجار",
    "salaries":                "الرواتب",
    "utilities":               "المرافق",
    "overhead":                "النفقات العامة",
    "marketing":               "التسويق",
    "cogs":                    "تكلفة البضاعة المباعة",
    "monthly_total":           "الإجمالي الشهري",
    "total":                   "الإجمالي",

    # ── توزيع رأس المال ──
    "capital_allocation":      "توزيع رأس المال",
    "operating_cushion":       "الاحتياطي التشغيلي",
    "capacity_pct":            "% من الطاقة",

    # ── توقع 3 سنوات ──
    "three_year_projection":   "التوقع لـ 3 سنوات — رحلة المشروع",
    "year":                    "السنة",
    "yearly_revenue":          "الإيراد السنوي",
    "yearly_profit":           "الربح السنوي",
    "cumulative_profit":       "الربح التراكمي",
    "cumulative_return":       "العائد التراكمي",
    "total_3yr_profit":        "إجمالي الربح الصافي (3 سنوات)",

    # ── المشروع الشهري ──
    "monthly_projection":      "التوقع الشهري",
    "month":                   "الشهر",
    "monthly_revenue_sar":     "إيراد شهري (ر.س)",
    "calculated_revenue":      "الإيراد الشهري المُحتسب",

    # ── اختبار الضغط ──
    "stress_test":             "اختبار الضغط (Stress Test)",
    "stressed_revenue":        "الإيراد بعد الضغط (ر.س)",
    "stressed_expenses":       "التكاليف بعد الضغط (ر.س)",
    "stressed_profit":         "صافي الربح بعد الضغط",
    "stressed_margin":         "الهامش بعد الضغط",
    "stress_methodology":      "المنهجية:",
    "stress_methodology_text": "خفض الإيراد 10% وزيادة المصاريف 10%.",

    # ── تحسين الهامش ──
    "improvement_18pct":       "خطة الوصول لهامش 18%",
    "target_net_profit":       "صافي الربح المستهدف (ر.س)",
    "max_expenses":            "الحد الأقصى للمصروفات (ر.س)",
    "required_saving":         "التوفير الشهري المطلوب (ر.س)",

    # ── القرار + الأسباب ──
    "classification":          "التصنيف",
    "score":                   "التقييم",
    "evaluation_reasons":      "أسباب التقييم",
    "factor":                  "العامل",
    "value":                   "القيمة",
    "rating":                  "التقييم",
    "reason":                  "السبب",
    "invest_conditions":       "شروط الاستثمار",
    "reject_conditions":       "أسباب الرفض",

    # ── المخاطر ──
    "risks_and_mitigations":   "المخاطر وخطط التخفيف",
    "risk":                    "المخاطرة",
    "severity":                "الخطورة",
    "mitigation":              "خطة التخفيف",

    # ── تحليل السوق ──
    "competition_level":       "مستوى المنافسة",
    "opportunity_score":       "درجة الفرصة السوقية",
    "competitors_count":       "عدد المنافسين",
    "avg_rating":              "متوسط التقييم",
    "strongest_competitor":    "أقوى منافس",
    "market_gap":              "الفجوة السوقية",
    "market_bullets":          "أبرز النتائج",
    "recommendations":         "التوصيات",
    "market_narrative":        "السرد التحليلي",
    "market_methodology":      "المنهجية: البيانات من Google Places + تحليل الذكاء الاصطناعي · مقدّم",
    "saudi_sector_rating":     "التقييم في قطاع المطاعم السعودي:",
    "name":                    "الاسم",
    "definition":              "التعريف",
    "formula":                 "الصيغة",
    "low":                     "أقل",
    "below_zero":              "أقل من 0%",

    # ── الفوتر ──
    "page":                    "صفحة",
    "of":                      "من",
    "footer_note":             "هذا التقرير تم توليده بواسطة منصة مُقدِّم — أداة ذكاء اصطناعي للدراسات الاستثمارية.",
    "footer_disclaimer":       "الأرقام تقديرية وقابلة للتغيّر حسب السوق والتنفيذ.",
}


LABELS_EN = {
    # ── Cover ──
    "brand_caption":           "MUQADDIM",
    "cover_subtitle":          "Project Feasibility Study",
    "cover_brand_top":         "Muqaddim Investment Studies Platform",
    "badge_suitable":          "Suitable for Investment",
    "badge_moderate":          "Moderate Risk",
    "badge_risk":              "High Risk",
    "cover_kpi_capital":       "Capital",
    "cover_kpi_revenue":       "Monthly Revenue",
    "cover_kpi_margin":        "Profit Margin",
    "cover_kpi_payback":       "Payback Period",
    "month_unit":              "months",
    "sar_unit":                "SAR",
    "percent_unit":            "%",

    # ── Main Sections ──
    "section_summary":         "Executive Summary & Project Overview",
    "section_financial":       "Financial Analysis",
    "section_decision":        "Investment Decision & Risks",
    "section_market":          "Market Analysis",
    "section_next_steps":      "Next Steps",

    # ── Executive Summary ──
    "verdict":                 "Recommendation:",
    "highlights":              "Key Highlights",
    "key_concern":             "Main Concern",
    "key_opportunity":         "Main Opportunity",

    # ── Project Overview ──
    "business_type":           "Business Type",
    "restaurant_type":         "Sub-type",
    "city":                    "City",
    "main_products":           "Main Products",
    "target_customers":        "Target Customers",
    "value_proposition":       "Value Proposition",
    "expected_customers":      "Expected Daily Customers",

    # ── Financial KPIs ──
    "monthly_revenue":         "Monthly Revenue",
    "monthly_expenses":        "Monthly Expenses",
    "monthly_net_profit":      "Monthly Net Profit",
    "profit_margin":           "Profit Margin",
    "payback_period":          "Payback Period",
    "break_even_revenue":      "Break-even Revenue",
    "break_even_month":        "Break-even Month",

    # ── Expenses Table ──
    "expenses_breakdown":      "Monthly Expenses Breakdown",
    "item":                    "Item",
    "amount_sar":              "Amount (SAR)",
    "rent":                    "Rent",
    "salaries":                "Salaries",
    "utilities":               "Utilities",
    "overhead":                "Overhead",
    "marketing":               "Marketing",
    "cogs":                    "Cost of Goods Sold",
    "monthly_total":           "Monthly Total",
    "total":                   "Total",

    # ── Capital Allocation ──
    "capital_allocation":      "Capital Allocation",
    "operating_cushion":       "Operating Cushion",
    "capacity_pct":            "% of capacity",

    # ── 3-Year Projection ──
    "three_year_projection":   "3-Year Projection — Project Journey",
    "year":                    "Year",
    "yearly_revenue":          "Annual Revenue",
    "yearly_profit":           "Annual Profit",
    "cumulative_profit":       "Cumulative Profit",
    "cumulative_return":       "Cumulative Return",
    "total_3yr_profit":        "Total Net Profit (3 Years)",

    # ── Monthly Projection ──
    "monthly_projection":      "Monthly Projection",
    "month":                   "Month",
    "monthly_revenue_sar":     "Monthly Revenue (SAR)",
    "calculated_revenue":      "Calculated Monthly Revenue",

    # ── Stress Test ──
    "stress_test":             "Stress Test",
    "stressed_revenue":        "Stressed Revenue (SAR)",
    "stressed_expenses":       "Stressed Expenses (SAR)",
    "stressed_profit":         "Stressed Net Profit",
    "stressed_margin":         "Stressed Margin",
    "stress_methodology":      "Methodology:",
    "stress_methodology_text": "Reduced revenue by 10% and increased expenses by 10%.",

    # ── Margin Improvement ──
    "improvement_18pct":       "Plan to Reach 18% Margin",
    "target_net_profit":       "Target Net Profit (SAR)",
    "max_expenses":            "Maximum Expenses (SAR)",
    "required_saving":         "Required Monthly Saving (SAR)",

    # ── Decision + Reasons ──
    "classification":          "Classification",
    "score":                   "Score",
    "evaluation_reasons":      "Evaluation Reasons",
    "factor":                  "Factor",
    "value":                   "Value",
    "rating":                  "Rating",
    "reason":                  "Reason",
    "invest_conditions":       "Investment Conditions",
    "reject_conditions":       "Rejection Conditions",

    # ── Risks ──
    "risks_and_mitigations":   "Risks & Mitigation Plans",
    "risk":                    "Risk",
    "severity":                "Severity",
    "mitigation":              "Mitigation Plan",

    # ── Market Analysis ──
    "competition_level":       "Competition Level",
    "opportunity_score":       "Market Opportunity Score",
    "competitors_count":       "Number of Competitors",
    "avg_rating":              "Average Rating",
    "strongest_competitor":    "Strongest Competitor",
    "market_gap":              "Market Gap",
    "market_bullets":          "Key Findings",
    "recommendations":         "Recommendations",
    "market_narrative":        "Analytical Narrative",
    "market_methodology":      "Methodology: Data from Google Places + AI analysis · Muqaddim",
    "saudi_sector_rating":     "Rating in the Saudi restaurants sector:",
    "name":                    "Name",
    "definition":              "Definition",
    "formula":                 "Formula",
    "low":                     "Low",
    "below_zero":              "Below 0%",

    # ── Footer ──
    "page":                    "Page",
    "of":                      "of",
    "footer_note":             "This report was generated by the Muqaddim Platform — an AI tool for investment studies.",
    "footer_disclaimer":       "Numbers are estimates and may vary with market conditions and execution.",
}


def get_labels(language: str = "ar") -> dict:
    """يُرجع قاموس النصوص بحسب اللغة. يفضّل الإنجليزي إذا language=='en'."""
    return LABELS_EN if language == "en" else LABELS_AR


def get_direction(language: str = "ar") -> str:
    """يُرجع 'rtl' للعربي و 'ltr' للإنجليزي."""
    return "ltr" if language == "en" else "rtl"


def get_lang_code(language: str = "ar") -> str:
    """يُرجع كود اللغة المناسب لـ <html lang=...> ."""
    return "en" if language == "en" else "ar"
