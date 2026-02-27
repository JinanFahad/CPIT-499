import json
from openai import OpenAI
from market_schema import MARKET_SCHEMA

client = OpenAI()


def build_competitor_summary(places: list[dict]) -> dict:
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

    ratings = [x["rating"] for x in simplified if isinstance(x.get("rating"), (int, float))]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    def score(x: dict) -> float:
        r = x.get("rating") or 0
        c = x.get("userRatingCount") or 0
        return (r * 10) + (min(c, 500) / 50)

    top = sorted(simplified, key=score, reverse=True)[:7]

    return {
        "count": len(simplified),
        "avg_rating": avg_rating,
        "top_competitors": top,
        "all_competitors": simplified,   # أزلت [:30] لأن Google ترجع max 20 أصلاً
    }


def generate_market_analysis_ar(
    project_type: str,
    city: str,
    radius_m: float,
    competitor_summary: dict
) -> dict:

    payload = json.dumps(competitor_summary, ensure_ascii=False)

    prompt = f"""
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

    response = client.responses.create(
        model="gpt-4o-mini",          # اسم صحيح
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

    return json.loads(response.output_text)