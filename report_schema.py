REPORT_SCHEMA = {
  "name": "feasibility_report",
  "schema": {
    "type": "object",
    "additionalProperties": False,
    "properties": {
      "title": {"type": "string"},
      "executive_summary": {"type": "string"},
      "business_overview": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "business_type": {"type": "string"},
          "city": {"type": "string"},
          "target_customers": {"type": "string"},
          "value_proposition": {"type": "string"}
        },
        "required": ["business_type", "city", "target_customers", "value_proposition"]
      },
      "market_analysis": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "demand_snapshot": {"type": "string"},
          "competitors": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": False,
              "properties": {
                "name": {"type": "string"},
                "strength": {"type": "string"},
                "weakness": {"type": "string"}
              },
              "required": ["name", "strength", "weakness"]
            }
          },
          "pricing_insights": {"type": "string"}
        },
        "required": ["demand_snapshot", "competitors", "pricing_insights"]
      },
      "financial_summary": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "monthly_revenue": {"type": "number"},
          "monthly_expenses": {"type": "number"},
          "monthly_net_profit": {"type": "number"},
          "profit_margin_percent": {"type": "number"},
          "break_even_revenue": {"type": "number"},
          "payback_period_months": {"type": ["number", "null"]}
        },
        "required": [
          "monthly_revenue", "monthly_expenses", "monthly_net_profit",
          "profit_margin_percent", "break_even_revenue", "payback_period_months"
        ]
      },
      "decision": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "classification": {"type": "string"},
          "score": {"type": "integer"},
          "reasons": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["classification", "score", "reasons"]
      },
      "risks_and_mitigations": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": False,
          "properties": {
            "risk": {"type": "string"},
            "mitigation": {"type": "string"}
          },
          "required": ["risk", "mitigation"]
        }
      },
      "next_steps": {
        "type": "array",
        "items": {"type": "string"}
      }
    },
    "required": [
      "title", "executive_summary", "business_overview",
      "market_analysis", "financial_summary", "decision",
      "risks_and_mitigations", "next_steps"
    ]
  }
}