MARKET_SCHEMA = {
  "type": "object",
  "properties": {

    # تصنيف كل مطعم بشكل فردي
    "classified_competitors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id":                   {"type": "string"},
          "estimated_cuisine":    {"type": "string"},
          "confidence":           {"type": "number"},
          "is_direct_competitor": {"type": "boolean"},
          "reason_short":         {"type": "string"}
        },
        "required": ["id","estimated_cuisine","confidence","is_direct_competitor","reason_short"],
        "additionalProperties": False
      }
    },

    # ملخص المنافسين المباشرين فقط
    "direct_competitor_summary": {
      "type": "object",
      "properties": {
        "count":           {"type": "integer"},
        "avg_rating":      {"type": "number"},
        "strongest_name":  {"type": "string"},
        "weakest_gap":     {"type": "string"}   # فرصة واضحة من الأضعف
      },
      "required": ["count","avg_rating","strongest_name","weakest_gap"],
      "additionalProperties": False
    },

    "narrative":         {"type": "string"},   # فقرة تحليلية مختصرة
    "bullets": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 3, "maxItems": 6
    },
    "recommendations": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 2, "maxItems": 5
    },
    "competition_level": {
      "type": "string",
      "enum": ["منخفض", "متوسط", "مرتفع"]
    },
    "market_opportunity_score": {   # رقم من 1-10 يساعد في قرار الجدوى
      "type": "integer"
    }
  },
  "required": [
    "classified_competitors",
    "direct_competitor_summary",
    "narrative",
    "bullets",
    "recommendations",
    "competition_level",
    "market_opportunity_score"
  ],
  "additionalProperties": False
}