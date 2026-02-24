PITCH_SCHEMA = {
  "type": "object",
  "additionalProperties": False,
  "properties": {
    "deck_title": {"type": "string"},
    "tagline": {"type": "string"},
    "slides": {
      "type": "array",
      "minItems": 8,
      "maxItems": 8,
      "items": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
          "title": {"type": "string"},
          "subtitle": {"type": "string"},
          "bullets": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 0,
            "maxItems": 3
          },
          "numbers": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": False,
              "properties": {
                "label": {"type": "string"},
                "value": {"type": "string"}
              },
              "required": ["label", "value"]
            },
            "maxItems": 4
          }
        },
        "required": ["title", "subtitle", "bullets", "numbers"]
      }
    }
  },
  "required": ["deck_title", "tagline", "slides"]
}