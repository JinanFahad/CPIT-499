# REPORT_SCHEMA = {
#   "name": "feasibility_report",
#   "schema": {
#     "type": "object",
#     "additionalProperties": False,
#     "properties": {
#       "title": {"type": "string"},
#       "executive_summary": {"type": "string"},
#      "business_overview": {
#   "type": "object",
#   "additionalProperties": False,
#   "properties": {
#     "business_type": {"type": "string"},
#     "restaurant_type": {"type": "string"},
#     "city": {"type": "string"},
#     "target_customers": {"type": "string"},
#     "value_proposition": {"type": "string"},
#     "main_products": {
#       "type": "array",
#       "items": {"type": "string"}
#     }
#   },
#   "required": [
#     "business_type",
#     "restaurant_type",
#     "city",
#     "target_customers",
#     "value_proposition",
#     "main_products"
#   ]
# },
#       "market_analysis": {
#   "type": "object",
#   "additionalProperties": False,
#   "properties": {
#     "narrative": {"type": "string"},
#     "competition_level": {
#       "type": "string",
#       "enum": ["منخفض", "متوسط", "مرتفع"]
#     },
#     "market_opportunity_score": {"type": "integer"},
#     "direct_competitor_summary": {
#       "type": "object",
#       "additionalProperties": False,
#       "properties": {
#         "count": {"type": "integer"},
#         "avg_rating": {"type": "number"},
#         "strongest_name": {"type": "string"},
#         "weakest_gap": {"type": "string"}
#       },
#       "required": ["count", "avg_rating", "strongest_name", "weakest_gap"]
#     },
#     "bullets": {
#       "type": "array",
#       "items": {"type": "string"}
#     },
#     "recommendations": {
#       "type": "array",
#       "items": {"type": "string"}
#     }
#   },
#   "required": [
#     "narrative",
#     "competition_level",
#     "market_opportunity_score",
#     "direct_competitor_summary",
#     "bullets",
#     "recommendations"
#   ]
# },
#       "financial_summary": {
#   "type": "object",
#   "additionalProperties": False,
#   "properties": {
#     "monthly_revenue": {"type": "number"},
#     "monthly_expenses": {"type": "number"},
#     "monthly_net_profit": {"type": "number"},
#     "profit_margin_percent": {"type": "number"},
#     "break_even_revenue": {"type": "number"},
#     "payback_period_months": {"type": ["number", "null"]},
#     "utilities_cost": {"type": "number"},
#     "overhead_cost": {"type": "number"},
#     "marketing_cost": {"type": "number"}
#   },
#   "required": [
#     "monthly_revenue",
#     "monthly_expenses",
#     "monthly_net_profit",
#     "profit_margin_percent",
#     "break_even_revenue",
#     "payback_period_months",
#     "utilities_cost",
#     "overhead_cost",
#     "marketing_cost"
#   ]
# },
#       "decision": {
#         "type": "object",
#         "additionalProperties": False,
#         "properties": {
#           "classification": {"type": "string"},
#           "score": {"type": "integer"},
#           "reasons": {"type": "array", "items": {"type": "string"}}
#         },
#         "required": ["classification", "score", "reasons"]
#       },
#       "risks_and_mitigations": {
#         "type": "array",
#         "items": {
#           "type": "object",
#           "additionalProperties": False,
#           "properties": {
#             "risk": {"type": "string"},
#             "mitigation": {"type": "string"}
#           },
#           "required": ["risk", "mitigation"]
#         }
#       },
#       "next_steps": {
#         "type": "array",
#         "items": {"type": "string"}
#       }
#     },
#     "required": [
#       "title", "executive_summary", "business_overview",
#       "market_analysis", "financial_summary", "decision",
#       "risks_and_mitigations", "next_steps"
#     ]
#   }
# }
REPORT_SCHEMA = {
  "name": "feasibility_report",
  "schema": {
    "type": "object",
    "additionalProperties": False,
    "properties": {

      "title": {"type": "string"},

      "executive_summary": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "verdict":    {"type": "string"},   # جملة واحدة: ما هو الحكم الاستثماري؟
          "highlights": {                      # 3 نقاط قصيرة مميزة
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3, "maxItems": 3
          },
          "key_concern": {"type": "string"},   # أكبر مخاطرة واحدة بجملة قصيرة
          "key_opportunity": {"type": "string"} # أبرز فرصة بجملة قصيرة
        },
        "required": ["verdict", "highlights", "key_concern", "key_opportunity"]
      },

      "business_overview": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "business_type":    {"type": "string"},
          "restaurant_type":  {"type": "string"},
          "city":             {"type": "string"},
          "target_customers": {"type": "string"},
          "value_proposition":{"type": "string"},
          "main_products":    {"type": "array", "items": {"type": "string"}}
        },
        "required": ["business_type","restaurant_type","city",
                     "target_customers","value_proposition","main_products"]
      },

      "market_analysis": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "narrative":           {"type": "string"},
          "competition_level":   {"type": "string", "enum": ["منخفض","متوسط","مرتفع"]},
          "market_opportunity_score": {"type": "integer"},
          "direct_competitor_summary": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
              "count":          {"type": "integer"},
              "avg_rating":     {"type": "number"},
              "strongest_name": {"type": "string"},
              "weakest_gap":    {"type": "string"}
            },
            "required": ["count","avg_rating","strongest_name","weakest_gap"]
          },
          "bullets":         {"type": "array", "items": {"type": "string"}},
          "recommendations": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["narrative","competition_level","market_opportunity_score",
                     "direct_competitor_summary","bullets","recommendations"]
      },

      "financial_summary": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "monthly_revenue":       {"type": "number"},
          "monthly_expenses":      {"type": "number"},
          "monthly_net_profit":    {"type": "number"},
          "profit_margin_percent": {"type": "number"},
          "break_even_revenue":    {"type": "number"},
          "payback_period_months": {"type": ["number","null"]},
          "utilities_cost":        {"type": "number"},
          "overhead_cost":         {"type": "number"},
          "marketing_cost":        {"type": "number"},
          "stress_test": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
              "revenue_drop_10pct":   {"type": "number"},
              "expenses_rise_10pct":  {"type": "number"},
              "stressed_net_profit":  {"type": "number"},
              "stressed_margin_pct":  {"type": "number"}
            },
            "required": ["revenue_drop_10pct","expenses_rise_10pct",
                         "stressed_net_profit","stressed_margin_pct"]
          },
          "improvement_to_18pct_margin": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
              "target_net_profit":   {"type": "number"},
              "max_expenses":        {"type": "number"},
              "required_saving":     {"type": "number"}
            },
            "required": ["target_net_profit","max_expenses","required_saving"]
          }
        },
        "required": [
          "monthly_revenue","monthly_expenses","monthly_net_profit",
          "profit_margin_percent","break_even_revenue","payback_period_months",
          "utilities_cost","overhead_cost","marketing_cost",
          "stress_test","improvement_to_18pct_margin"
        ]
      },

      "decision": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "classification": {"type": "string"},
          "score":          {"type": "integer"},
          "reasons":        {"type": "array", "items": {"type": "string"}},
          "invest_conditions": {
            "type": "array", "items": {"type": "string"}  # شروط الاستثمار
          },
          "reject_conditions": {
            "type": "array", "items": {"type": "string"}  # شروط الرفض
          }
        },
        "required": ["classification","score","reasons",
                     "invest_conditions","reject_conditions"]
      },

      "risks_and_mitigations": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": False,
          "properties": {
            "risk":       {"type": "string"},
            "severity":   {"type": "string", "enum": ["عالي","متوسط","منخفض"]},
            "mitigation": {"type": "string"}
          },
          "required": ["risk","severity","mitigation"]
        }
      },

      "next_steps": {
        "type": "array",
        "items": {"type": "string"}
      }
    },

    "required": [
      "title","executive_summary","business_overview",
      "market_analysis","financial_summary","decision",
      "risks_and_mitigations","next_steps"
    ]
  }
}