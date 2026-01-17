from fastapi import FastAPI
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

VALID_REGIONS = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie", "łódzkie", 
    "małopolskie", "mazowieckie", "opolskie", "podkarpackie", "podlaskie", 
    "pomorskie", "śląskie", "świętokrzyskie", "warmińsko-mazurskie", 
    "wielkopolskie", "zachodniopomorskie"
]

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
    system_prompt = f"""
    Jesteś analitykiem mediów dla regionu: {region_name}.
    Twoim zadaniem jest ocena dwóch parametrów:
    1. RELEVANCE (0.0 do 1.0): Jak bardzo ten artykuł dotyczy konkretnie spraw lokalnych tego regionu?
       - 1.0: Ściśle lokalne (np. wypadek w centrum miasta, lokalne wybory, budowa drogi w powiecie).
       - 0.5: Dotyczy regionu, ale też całego kraju (np. skutki nowej ustawy dla rolników z regionu).
       - 0.1: Ogólnopolskie/Światowe, słaby związek z regionem.
       - 0.0: Zupełnie nietrafione (np. news z innego województwa).

    2. SENTIMENT (od -1.0 (negatywny) do 1.0 (pozytywny)): Wydźwięk emocjonalny tekstu.

    Zwróć TYLKO JSON: {{ "relevance": float, "sentiment": float }}
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
        return {"relevance": 0.0, "sentiment": 0.0}

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
                print(f"News już istnieje w bazie: {entry.link}")
                continue

            raw_summary = entry.get('summary', '')
            clean_summary_text = clean_html(raw_summary)
            full_text = f"{entry.title}. {clean_summary_text}"

            analysis = analyze_with_gpt(full_text, feed.get("region", "Polska"))
            
            relevance = analysis.get("relevance", 0.0)
            temperature = analysis.get("sentiment", 0.0)
            label = get_label_from_score(temperature)

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

            new_record = {
                "title": entry.title,
                "link": entry.link,
                "published": final_iso_date,
                "summary": clean_summary_text,
                "source": feed.get("name", "Nieznane źródło"),
                "region": feed.get("region", "Polska"),
                "category": feed.get("category", "Ogólne"),
                "sentiment_label": label,
                "temperature": temperature,
                "local_relevance": relevance
            }
            
            try:
                supabase.table("news").insert(new_record).execute()
            except Exception as e:
                print(f"Błąd zapisu: {e}")
            count_new += 1
            
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
def force_update():
    return sync_logic()

@app.get("/rss")
def read_rss():
    """Endpoint dla widoku LISTY newsów"""
    return get_data_only()

@app.get("/map-data")
def read_map_data():
    """Endpoint dla widoku MAPY"""

    cutoff_date = datetime.now(timezone.utc) - timedelta(hours=48)
    cutoff_str = cutoff_date.isoformat()

    try:
        response = supabase.table("news").select("*").gte("published", cutoff_str).execute()
        news_list = response.data
    except Exception as e:
        print(f"Błąd pobierania danych dla mapy: {e}")
        news_list = []
    
    region_stats = {region: {"weighted_sum": 0.0, "total_weight": 0.0} for region in VALID_REGIONS}
    
    for item in news_list:
        r = item.get('region')
        if not r: continue
        key = r.lower().strip()
        
        if key in region_stats:
            temp = item.get('temperature', 0.0)
            weight = item.get('relevance', 1.0) 
            
            region_stats[key]["weighted_sum"] += (temp * weight)
            region_stats[key]["total_weight"] += weight

    regional_averages = {}
    for region in VALID_REGIONS:
        stats = region_stats[region]
        if stats["total_weight"] > 0:
            avg = stats["weighted_sum"] / stats["total_weight"]
            regional_averages[region] = round(avg, 2)
        else:
            regional_averages[region] = None

    return regional_averages