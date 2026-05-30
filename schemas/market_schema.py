
MARKET_SCHEMA = {
  "type": "object",
  "properties": {

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

    "direct_competitor_summary": {
      "type": "object",
      "properties": {
        "count":           {"type": "integer"},
        "avg_rating":      {"type": "number"},
        "strongest_name":  {"type": "string"},
        "weakest_gap":     {"type": "string"}  
      },
      "required": ["count","avg_rating","strongest_name","weakest_gap"],
      "additionalProperties": False
    },

    "narrative":         {"type": "string"},  
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
      "enum": ["منخفض", "متوسط", "مرتفع", "Low", "Moderate", "High"]
    },
    "market_opportunity_score": {  
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