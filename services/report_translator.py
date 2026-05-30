import json
import copy
from openai import OpenAI

client = OpenAI()

def get_or_create_translation(report: dict, target_lang: str) -> dict:
    """يرجع نسخة من التقرير بـ target_lang (ar أو en).

    - إذا التقرير أصلاً بنفس اللغة → نرجعه كما هو.
    - إذا فيه ترجمة مخزنة (cache) → نرجعها فوراً.
    - وإلا → نطلب من OpenAI ترجمة النصوص  نخزّنها داخل
      report["_translations"][target_lang]، ونرجعها.

    يرجع: (translated_report, was_newly_translated: bool)
    """
    target_lang = target_lang.lower()
    if target_lang not in ("ar", "en"):
        target_lang = "ar"

    current_lang = _detect_report_language(report)
    if current_lang == target_lang:
        return report, False

    cache = report.get("_translations") or {}
    cached = cache.get(target_lang)
    if cached:
        return cached, False

    translated = _translate_with_ai(report, target_lang)

    cache[target_lang] = translated
    cache[current_lang] = _strip_translations_cache(report) 
    report["_translations"] = cache

    return translated, True


def _detect_report_language(report: dict) -> str:
    """يكتشف لغة التقرير من نص الـ verdict أو العنوان."""
    sample = ""
    es = report.get("executive_summary")
    if isinstance(es, dict):
        sample = es.get("verdict", "")
    elif isinstance(es, str):
        sample = es
    if not sample:
        sample = report.get("title", "")
    for ch in sample:
        if "؀" <= ch <= "ۿ":
            return "ar"
    return "en"


def _strip_translations_cache(report: dict) -> dict:
    cleaned = copy.deepcopy(report)
    cleaned.pop("_translations", None)
    return cleaned


_FREE_TEXT_PATHS = [
    ["title"],
    ["executive_summary", "verdict"],
    ["executive_summary", "highlights"],         
    ["executive_summary", "key_concern"],
    ["executive_summary", "key_opportunity"],
    ["business_overview", "target_customers"],
    ["business_overview", "value_proposition"],
    ["business_overview", "main_products"],      
    ["market_analysis", "narrative"],
    ["market_analysis", "bullets"],              
    ["market_analysis", "recommendations"],      
    ["market_analysis", "direct_competitor_summary", "weakest_gap"],
    ["next_steps"],                               
]


def _translate_with_ai(report: dict, target_lang: str) -> dict:
    translated = _strip_translations_cache(report)

    payload = {}
    for path in _FREE_TEXT_PATHS:
        value = _get_path(translated, path)
        if value is None:
            continue
        key = ".".join(path)
        payload[key] = value


    risks = translated.get("risks_and_mitigations") or []
    for i, r in enumerate(risks):
        if isinstance(r, dict):
            if r.get("risk"):
                payload[f"risks_and_mitigations.{i}.risk"] = r["risk"]
            if r.get("mitigation"):
                payload[f"risks_and_mitigations.{i}.mitigation"] = r["mitigation"]

    dec = translated.get("decision") or {}
    for cond_key in ("invest_conditions", "reject_conditions"):
        items = dec.get(cond_key) or []
        for i, item in enumerate(items):
            payload[f"decision.{cond_key}.{i}"] = item

    if not payload:
        return translated

    lang_label = "Arabic" if target_lang == "ar" else "English"
    prompt = f"""You will be given a JSON object containing free-text fields from an investment
feasibility report. Translate each value into {lang_label}, preserving:
- All numbers, percentages, currencies (e.g., 28.14%, 200,000 SAR) — keep them exactly as in the source.
- Real proper nouns (restaurant names, place names like "Jeddah", brand names like "SAYA5",
  "POPEYES", "Hardee's") — keep them as-is. Do not translate them.
- City names: translate "Jeddah" ↔ "جدة", "Riyadh" ↔ "الرياض", "Dammam" ↔ "الدمام" when natural.
- The structure: return the SAME JSON shape, only the values change to {lang_label}.

Return ONLY a JSON object with the same keys.

Input:
{json.dumps(payload, ensure_ascii=False, indent=2)}
"""

    response = client.responses.create(
        model="gpt-4o-mini",
        input=prompt,
        text={"format": {"type": "json_object"}}
    )
    translated_payload = json.loads(response.output_text)

    for key, value in translated_payload.items():
        parts = key.split(".")

        if parts[0] == "risks_and_mitigations" and len(parts) == 3:
            idx = int(parts[1])
            field = parts[2]
            risks = translated.get("risks_and_mitigations") or []
            if 0 <= idx < len(risks) and isinstance(risks[idx], dict):
                risks[idx][field] = value
                
        elif parts[0] == "decision" and len(parts) == 3 and parts[1] in ("invest_conditions", "reject_conditions"):
            idx = int(parts[2])
            dec = translated.setdefault("decision", {})
            lst = dec.setdefault(parts[1], [])
            if 0 <= idx < len(lst):
                lst[idx] = value
        else:
            _set_path(translated, parts, value)

    return translated


def _get_path(obj: dict, path: list):
    cur = obj
    for p in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(p)
        if cur is None:
            return None
    return cur


def _set_path(obj: dict, path: list, value):
    cur = obj
    for p in path[:-1]:
        if not isinstance(cur.get(p), dict):
            cur[p] = {}
        cur = cur[p]
    cur[path[-1]] = value
