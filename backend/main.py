from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import feedparser
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv
import re
import html
import os

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

NEWS_COUNT = 10

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

def analyze_with_gpt(text):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "Jesteś ekspertem od oceny sentymentu. Oceń następujący tekst będący nagłówkiem i podsumowaniem wiadomości. Zwróć TYLKO liczbę zmiennoprzecinkową od -1.0 (negatywny) do 1.0 (pozytywny) określającą wydźwięk tekstu."
                },
                {"role": "user", "content": text[:1000]}
            ],
            temperature=0.0
        )
        print(f"Analizowanie newsa {text[:30]}")
        return float(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Błąd OpenAI: {e}")
        return 0.0

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

def sync_and_get_news():
    # 1. Pobranie listy kanałów
    try:
        print("Pobieranie listy kanałów z Supabase...")
        response = supabase.table("feeds").select("*").execute()
        FEEDS = response.data
        print(f"Znaleziono {len(FEEDS)} kanałów RSS.")
    except Exception as e:
        print(f"Błąd pobierania listy feedów z bazy: {e}")
        FEEDS = []

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
            
        for entry in parsed.entries[:NEWS_COUNT]: 
            # sprawdzanie czy news już jest w bazie
            existing = supabase.table("news").select("id").eq("link", entry.link).execute()
            
            if existing.data:
                print(f"News już istnieje w bazie: {entry.link}")
                continue

            raw_summary = entry.get('summary', '')
            clean_summary_text = clean_html(raw_summary)
            full_text = f"{entry.title}. {clean_summary_text}"

            temperature = analyze_with_gpt(full_text)
            label = get_label_from_score(temperature)

            # zapisywanie newsa do bazy
            new_record = {
                "title": entry.title,
                "link": entry.link,
                "published": entry.get('published', "Brak daty"),
                "summary": clean_summary_text,
                "source": feed.get("name", "Nieznane źródło"),
                "region": feed.get("region", "Polska"),
                "category": feed.get("category", "Ogólne"),
                "sentiment_label": label,
                "temperature": temperature
            }
            
            try:
                supabase.table("news").insert(new_record).execute()
            except Exception as e:
                print(f"Błąd zapisu: {e}")

    try:
        response = supabase.table("news").select("*").order("id", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        print(f"Błąd pobierania newsów: {e}")
        return []

# --- ENDPOINTY ---

@app.get("/rss")
def read_rss():
    """Endpoint dla widoku LISTY newsów"""
    return sync_and_get_news()

@app.get("/map-data")
def read_map_data():
    """Endpoint dla widoku MAPY"""
    news_list = sync_and_get_news()
    
    region_temps = {region: [] for region in VALID_REGIONS}
    
    for item in news_list:
        region_temps[item['region']].append(item['temperature'])

    regional_averages = {}
    for region in VALID_REGIONS:
        temps = region_temps[region]
        if temps:
            avg_temp = sum(temps) / len(temps)
            regional_averages[region] = round(avg_temp, 2)
        else:
            regional_averages[region] = None

    return regional_averages