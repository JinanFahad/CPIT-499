import requests
import json
import sys

API_KEY = "PUT_YOUR_API_KEY_HERE"

def search_districts_ar(city_ar):
    url = "https://places.googleapis.com/v1/places:searchText"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.types,places.formattedAddress"
    }

    body = {
        "textQuery": f"حي في {city_ar}",
        "maxResultCount": 50
    }

    response = requests.post(url, headers=headers, json=body).json()

    print("RAW RESPONSE:")
    print(json.dumps(response, ensure_ascii=False, indent=2))

    places = response.get("places", [])

    districts = []

    for p in places:
        types = p.get("types", [])
        name = p["displayName"]["text"]

        # نقبل أي نتيجة شكلها حي
        if (
            "sublocality" in types
            or "sublocality_level_1" in types
            or "political" in types
        ):
            districts.append(name)

    return list(set(districts))


def save_to_json(city, districts):
    filename = f"{city}_districts.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(districts, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(districts)} districts to {filename}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_districts.py 'جدة'")
        sys.exit()

    city = sys.argv[1]

    districts = search_districts_ar(city)
    save_to_json(city, districts)