# market_ai.py
# Market analysis module powered by OpenAI. Takes the raw places returned by
# Google Places for the project's neighborhood and produces:
#   - A direct vs indirect competitor classification for each place.
#   - A summary of direct competitors (count, average rating, strongest one).
#   - A narrative analysis plus practical recommendations.
#   - A market opportunity score from 1 to 10.

import json
import logging
from openai import OpenAI, OpenAIError
from market_schema import MARKET_SCHEMA

logger = logging.getLogger(__name__)

client = OpenAI()



def _fallback_market_analysis(language: str = "ar") -> dict:
    """Return a neutral placeholder result so the feasibility flow can finish
    even when OpenAI is unavailable or returns malformed output."""
    is_en = language == "en"
    return {
        "narrative": (
            "Market analysis is currently unavailable. The investment decision is based on financial figures only."
            if is_en else
            "تحليل السوق غير متاح حالياً. القرار الاستثماري مبني على الأرقام المالية فقط."
        ),
        "competition_level": "Moderate" if is_en else "متوسط",
        "market_opportunity_score": 5,
        "direct_competitor_summary": {
            "count": 0,
            "avg_rating": 0,
            "strongest_name": "No data available" if is_en else "لا تتوفر بيانات",
            "weakest_gap": "Insufficient data" if is_en else "بيانات غير كافية",
        },
        "bullets": [],
        "recommendations": [],
        "classified_competitors": [],
    }


def build_competitor_summary(places: list[dict]) -> dict:
    """Reduce the raw Google Places response into a lightweight summary:
    keep only the fields the AI needs, compute an average rating, and rank
    the top seven competitors by a simple rating-times-reviews score."""
    simplified = []
    for p in places:
        simplified.append({
            "id": p.get("id"),
            "name": (p.get("displayName") or {}).get("text"),
            "rating": p.get("rating"),
            "userRatingCount": p.get("userRatingCount"),
            "address": p.get("formattedAddress"),
            "types": p.get("types", []),
            "primaryType": p.get("primaryType"),
            "primaryTypeDisplayName": (p.get("primaryTypeDisplayName") or {}).get("text"),
        })

#عشان نعرف مستوى المنافسة في السوق، بنحسب متوسط التقييم لكل المنافسين  عشان نعطي فكرة عن جودة المطاعم الموجودة في المنطقةن .
    ratings = [x["rating"] for x in simplified 
               if isinstance(x.get("rating"), (int, float))]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    # Ranking heuristic: rating * 10 plus a review-count bonus.
    # Reviews are capped at 500 so one viral restaurant cannot dominate.
    def score(x: dict) -> float:
        r = x.get("rating") or 0
        c = x.get("userRatingCount") or 0
        return (r * 10) + (min(c, 500) / 50) # r = 50 , c= 10  هذي اكبر قيم وبكذا نضمن ان ال تقييمات دائما اهم من المراجعات وهي اللي بتاثر اكبر في المعادله 

    top = sorted(simplified, key=score, reverse=True)[:7]

    return {
        "count": len(simplified),
        "avg_rating": avg_rating,
        "top_competitors": top,
        "all_competitors": simplified,
    }


def generate_market_analysis_ar(
    project_type: str,
    city: str,
    radius_m: float,
    competitor_summary: dict,
    language: str = "ar",
) -> dict:
    """Send the competitor summary to OpenAI for analysis and return a
    structured dict matching MARKET_SCHEMA.

    The AI classifies each place as a direct or indirect competitor, then
    writes the narrative, bullets, recommendations, competition_level, and
    market_opportunity_score. On any failure the function falls back to a
    neutral placeholder rather than raising — the feasibility flow should
    not be blocked by market analysis problems.
    """
    if not isinstance(competitor_summary, dict):
        raise ValueError("competitor_summary must be a dict")
    if language not in ("ar", "en"):
        language = "ar"

    try:
        payload = json.dumps(competitor_summary, ensure_ascii=False)
    except (TypeError, ValueError) as e:
        logger.warning("market_ai: failed to serialize competitor_summary (%s)", e)
        return _fallback_market_analysis(language)

    if language == "en":
        prompt = _build_english_prompt(project_type, city, radius_m, payload)
    else:
        prompt = _build_arabic_prompt(project_type, city, radius_m, payload)

    try:
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "market_analysis",
                    "schema": MARKET_SCHEMA,
                    "strict": True
                }
            }
        )
    except OpenAIError:
        logger.exception("market_ai: OpenAI call failed, returning fallback")
        return _fallback_market_analysis(language)
    except Exception:
        logger.exception("market_ai: unexpected error, returning fallback")
        return _fallback_market_analysis(language)

    try:
        return json.loads(response.output_text)
    except (json.JSONDecodeError, AttributeError, TypeError) as e:
        logger.warning("market_ai: invalid JSON from AI, returning fallback (%s)", e)
        return _fallback_market_analysis(language)


def _build_arabic_prompt(project_type, city, radius_m, payload) -> str:
    return f"""
أنت محلل سوق متخصص في قطاع المطاعم. مهمتك تحليل بيانات منافسين حقيقية من Google Maps
وتقديم تحليل مفيد وعملي لصاحب مشروع يدرس جدوى افتتاح مطعمه.

═══════════════════════════════
معلومات المشروع المقترح:
- نوع المطعم: {project_type}
- المدينة: {city}
- نطاق الدراسة: {radius_m} متر حول الموقع المختار
═══════════════════════════════

بيانات المطاعم الموجودة في المنطقة (من Google Places):
{payload}

═══════════════════════════════
المطلوب منك بالترتيب:

1. صنّف كل مطعم في "classified_competitors":
   - استخدم: الاسم + primaryType + types + primaryTypeDisplayName
   - حدد estimated_cuisine (نوع المطبخ المتوقع)
   - حدد is_direct_competitor: true فقط إذا يقدم نفس نوع مطبخ "{project_type}"
   - أعطِ confidence بين 0 و1 بناءً على وضوح البيانات
   - reason_short: جملة واحدة تبرر قرارك

2. احسب "direct_competitor_summary" من المنافسين المباشرين فقط:
   - count: عددهم
   - avg_rating: متوسط تقييماتهم (أو 0 إذا ما في بيانات)
   - strongest_name: اسم الأقوى (أعلى rating × reviews)
   - weakest_gap: فرصة واضحة — مثلاً "معظمهم تحت 3.5 تقييم" أو "لا يوجد منافس مباشر"

3. اكتب "narrative": فقرة 3-4 جمل تشرح وضع السوق بشكل مباشر لصاحب المشروع،
   ركّز على: هل السوق مشبع؟ وين الفرصة؟

4. "bullets": 3-6 نقاط ملموسة مثل:
   - "٥ مطاعم مباشرة في النطاق، متوسط تقييمها ٣.٨"
   - "أقوى منافس: [الاسم] بتقييم ٤.٦ و٣٢٠ مراجعة"
   - "لا يوجد منافس بتقييم فوق ٤ في هذا النطاق — فرصة جودة"

5. "recommendations": 2-5 توصيات عملية مباشرة لصاحب المشروع

6. "competition_level": منخفض / متوسط / مرتفع — بناءً على عدد المنافسين المباشرين

7. "market_opportunity_score": رقم من 1 إلى 10
   (10 = فرصة ممتازة، 1 = سوق مشبع جداً)

قواعد:
- لا تختلق أي معلومات
- إذا البيانات غير كافية: confidence منخفضة و estimated_cuisine = "غير واضح"
- الأرقام في النتائج لازم تطابق البيانات الفعلية
- اكتب بالعربية فقط
"""


def _build_english_prompt(project_type, city, radius_m, payload) -> str:
    return f"""
You are a market analyst specialized in the restaurant industry. Your task is to analyze
real competitor data from Google Maps and provide a useful, practical analysis for a project
owner studying the feasibility of opening a new restaurant.

═══════════════════════════════
Proposed project information:
- Restaurant type: {project_type}
- City: {city}
- Study radius: {radius_m} meters around the selected location
═══════════════════════════════

Nearby restaurants data (from Google Places):
{payload}

═══════════════════════════════
Required, in order:

1. Classify each restaurant in "classified_competitors":
   - Use: name + primaryType + types + primaryTypeDisplayName
   - Determine estimated_cuisine (the most likely cuisine type)
   - Set is_direct_competitor: true ONLY if it serves the same cuisine as "{project_type}"
   - Provide confidence between 0 and 1 based on clarity of data
   - reason_short: one sentence justifying your decision

2. Compute "direct_competitor_summary" from direct competitors only:
   - count: their number
   - avg_rating: their average rating (or 0 if no data)
   - strongest_name: name of the strongest one (highest rating × reviews)
   - weakest_gap: a clear gap/opportunity — e.g. "most are under 3.5 rating" or
     "no direct competitor"

3. Write "narrative": a 3-4 sentence paragraph explaining the market state directly
   to the owner. Focus on: is the market saturated? Where is the opportunity?

4. "bullets": 3-6 concrete points like:
   - "5 direct restaurants in radius, average rating 3.8"
   - "Strongest competitor: [name] at 4.6 with 320 reviews"
   - "No competitor above 4 in this radius — quality opportunity"

5. "recommendations": 2-5 practical, direct recommendations for the owner.

6. "competition_level": MUST be exactly one of these English strings: "Low", "Moderate", or "High".
   Do NOT use Arabic. Choose based on the number of direct competitors.

7. "market_opportunity_score": a number from 1 to 10
   (10 = excellent opportunity, 1 = highly saturated market)

Rules:
- Do NOT make up information.
- If data is insufficient: low confidence and estimated_cuisine = "Unclear".
- Numbers in the results must match the actual data.
- ALL textual output (narrative, bullets, recommendations, reason_short, strongest_name,
  weakest_gap, estimated_cuisine, competition_level) MUST be in English only.
- Do NOT use any Arabic word anywhere in the response.
"""