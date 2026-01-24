from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import feedparser
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv
import re
import html
import os
import json
from datetime import datetime, timedelta, timezone
import time
from dateutil import parser
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable

# Ładowanie zmiennych z .env
load_dotenv()

# --- KONFIGURACJA I STAŁE ---

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Inicjalizacja klienta
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("UWAGA: Brak zmiennych SUPABASE_URL/KEY w pliku .env")

geolocator = Nominatim(user_agent="senti-news-app")

VALID_REGIONS = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie", "łódzkie", 
    "małopolskie", "mazowieckie", "opolskie", "podkarpackie", "podlaskie", 
    "pomorskie", "śląskie", "świętokrzyskie", "warmińsko-mazurskie", 
    "wielkopolskie", "zachodniopomorskie"
]

HOURS_LIMIT = 72

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HTML_TAGS_PATTERN = re.compile('<.*?>')

# --- FUNKCJE POMOCNICZE ---

def analyze_with_gpt(text, region_name):
    if(region_name.lower() == "polska"):
        system_prompt = f"""
        Jesteś analitykiem mediów w Polsce.
        Zwróć JSON z 3 polami:
        1. "detected_region" (string lub null): Nazwa województwa (małą literą), jeśli news dotyczy konkretnego regionu Polski.
        - Wybierz z listy: {str(VALID_REGIONS)}.
        - Jeśli nie dotyczy konkretnego regionu lub dotyczy całej Polski -> null.
        2. "location" (string lub null): Precyzyjna nazwa miejsca, tak, aby można było użyć na nim geolokalizacji (np. używając biblioteki geopy).
        - Jeśli brak konkretnej lokalizacji -> null.
        3. "sentiment" (float -1.0 do 1.0): Wydźwięk emocjonalny.

        Przykład: {{ "detected_region": "małopolskie", "location": "Giewont", "sentiment": -0.5 }}
        """
    else:
        system_prompt = f"""
        Jesteś analitykiem mediów dla regionu: {region_name}.
        Zwróć JSON z 4 polami:
        1. "relevance" (float 0.0 do 1.0): Jak bardzo dotyczy to spraw lokalnych tego regionu?
        2. "sentiment" (float -1.0 do 1.0): Wydźwięk emocjonalny.
        3. "detected_region" (string lub null): Nazwa województwa (małą literą), jeśli news dotyczy konkretnego regionu Polski.
        - Wybierz z listy: {str(VALID_REGIONS)}.
        - Jeśli nie dotyczy konkretnego regionu lub dotyczy całej Polski -> null.
        4. "location" (string lub null): Precyzyjna nazwa miejsca, tak, aby można było użyć na nim geolokalizacji (np. używając biblioteki geopy).
        - Jeśli brak konkretnej lokalizacji -> null.

        Przykład: {{ "relevance": 0.9, "sentiment": -0.5, "detected_region": "małopolskie", "location": "Giewont" }}
        """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text[:1500]}
            ],
            temperature=0.0,
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Błąd analizy: {e}")
        return {"relevance": 0.0, "sentiment": 0.0, "location": None, "detected_region": None}

def get_label_from_score(score):
    if score <= -0.5: return "very negative"
    if score < -0.1: return "negative"
    if score > 0.5: return "very positive"
    if score > 0.1: return "positive"
    return "neutral"

def clean_html(raw_html):
    # czyszczenie podsumowania newsów
    if not raw_html:
        return ""
    
    text = re.sub(HTML_TAGS_PATTERN, ' ', raw_html)

    for _ in range(3):
        previous_text = text
        text = html.unescape(text)
        if text == previous_text:
            break

    return " ".join(text.split())

def sync_logic():
    print("--- START: Automatyczna aktualizacja bazy ---")
    # 1. Pobranie listy kanałów
    try:
        print("Pobieranie listy kanałów z Supabase...")
        response = supabase.table("feeds").select("*").execute()
        FEEDS = response.data
        print(f"Znaleziono {len(FEEDS)} kanałów RSS.")
    except Exception as e:
        print(f"Błąd pobierania listy feedów z bazy: {e}")
        return {"status": "error", "message": str(e)}

    count_new = 0
    for feed in FEEDS:
        url = feed.get("url")
        if not url: 
            print("Brak URL w feedzie, pomijam...")
            continue

        try:
            parsed = feedparser.parse(url)
        except Exception:
            print(f"Błąd parsowania feeda: {url}")
            continue
            
        for entry in parsed.entries: 
            # sprawdzanie czy news już jest w bazie
            existing = supabase.table("news").select("id").eq("link", entry.link).execute()
            
            if existing.data:
                continue

            raw_summary = entry.get('summary', '')
            clean_summary_text = clean_html(raw_summary)
            full_text = f"{entry.title}. {clean_summary_text}"

            # Analiza AI
            region = feed.get("region", "Polska")
            analysis = analyze_with_gpt(full_text, region)
            
            relevance = analysis.get("relevance", 1.0)
            temperature = analysis.get("sentiment", 0.0)
            label = get_label_from_score(temperature)
            detected_location = analysis.get("location")
            detected_region = analysis.get("detected_region")

            final_region = region
            if region == "Polska" and detected_region in VALID_REGIONS:
                final_region = detected_region
            
            # Parsowanie daty
            published_struct = entry.get('published_parsed') or entry.get('updated_parsed')
            
            final_iso_date = None

            if published_struct:
                ts = time.mktime(published_struct)
                dt_object = datetime.fromtimestamp(ts)
                final_iso_date = dt_object.isoformat()
            else:
                raw_date_str = entry.get('published')
                if raw_date_str:
                    try:
                        dt_object = parser.parse(raw_date_str)
                        final_iso_date = dt_object.isoformat()
                        print(f"[INFO] Uratowano datę z tekstu: '{raw_date_str}' -> {final_iso_date}")
                    except Exception:
                        print(f"[WARN] Nie udało się sparsować daty: '{raw_date_str}'")

            latitude = None
            longitude = None
            if detected_location:
                try:
                    # Dodajemy ", Polska" aby zawęzić wyszukiwanie i timeout
                    location = geolocator.geocode(f"{detected_location}, Polska", timeout=10)
                    if location:
                        latitude = location.latitude
                        longitude = location.longitude
                        print(f"Zgeolokalizowano '{detected_location}' na: {latitude}, {longitude}")
                    else:
                        print(f"Nie znaleziono koordynatów dla '{detected_location}, Polska'")
                except (GeocoderTimedOut, GeocoderUnavailable) as e:
                    print(f"Błąd usługi geolokalizacji dla '{detected_location}': {e}")
                except Exception as e:
                    print(f"Nieoczekiwany błąd geolokalizacji dla '{detected_location}': {e}")

            new_record = {
                "title": entry.title,
                "link": entry.link,
                "published": final_iso_date,
                "summary": clean_summary_text,
                "source": feed.get("name", "Nieznane źródło"),
                "region": final_region,
                "category": feed.get("category", "Ogólne"),
                "sentiment_label": label,
                "temperature": temperature,
                "local_relevance": relevance,
                "location_name": detected_location,
                "lat": latitude,
                "lon": longitude,
            }
            
            try:
                supabase.table("news").insert(new_record).execute()
                count_new += 1
            except Exception as e:
                print(f"Błąd zapisu: {e}")
            
    print(f"--- KONIEC: Dodano {count_new} nowych artykułów ---")
    return {"status": "success", "added": count_new}

def get_data_only():
    try:
        response = supabase.table("news").select("*").order("id", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Błąd pobierania newsów: {e}")
        return []

# --- ENDPOINTY ---

@app.get("/update-news")
def force_update(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_logic)
    return {"status": "accepted", "message": "Synchronizacja rozpoczęta w tle"}

@app.get("/rss")
def read_rss():
    """Endpoint dla widoku LISTY newsów"""
    return get_data_only()

@app.get("/map-data")
def read_map_data():
    """Endpoint dla widoku MAPY"""
    cutoff_str = (datetime.now(timezone.utc) - timedelta(hours=HOURS_LIMIT)).isoformat()
    try:
        response = supabase.table("news").select("*").gte("published", cutoff_str).execute()
        news_list = response.data
    except Exception as e:
        print(f"Błąd pobierania danych dla mapy: {e}")
        news_list = []
    
    region_stats = {region: {"weighted_sum": 0.0, "total_weight": 0.0, "items": []} for region in VALID_REGIONS}
    
    for item in news_list:
        r = item.get('region')
        if not r: continue
        region_name = r.lower().strip()
        
        if region_name in region_stats:
            temp = item.get('temperature', 0.0)
            weight = item.get('local_relevance')
            if weight is None: weight = 1.0
            
            region_stats[region_name]["weighted_sum"] += (temp * weight)
            region_stats[region_name]["total_weight"] += weight
            
            region_stats[region_name]["items"].append({
                "title": item.get("title"),
                "link": item.get("link"),
                "temperature": temp,
                "relevance": weight
            })

    regional_data = {}
    for region in VALID_REGIONS:
        stats = region_stats[region]
        avg = None
        if stats["total_weight"] > 0:
            avg = stats["weighted_sum"] / stats["total_weight"]
            avg = round(avg, 2)
            
        top_news = sorted(stats["items"], key=lambda x: (x['relevance'], abs(x['temperature'] * x['relevance'])), reverse=True)[:5]

        regional_data[region] = {
            "temperature": avg,
            "news": top_news
        }

    return regional_data