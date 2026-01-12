from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import feedparser
from transformers import pipeline
import re
import html
import os
import time

# --- KONFIGURACJA I STAŁE ---

# liczba newsów do pobrania z każdego feeda
NEWS_COUNT = 10

VALID_REGIONS = [
    "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie", "łódzkie", 
    "małopolskie", "mazowieckie", "opolskie", "podkarpackie", "podlaskie", 
    "pomorskie", "śląskie", "świętokrzyskie", "warmińsko-mazurskie", 
    "wielkopolskie", "zachodnio-pomorskie"
]

CATEGORIES = [
    "Ogólne", "Turystyka", "Sport", "Rozrywka"
]

CACHE_FILE = "sentiment_cache.json"
CACHE_TTL_SECONDS = 60 * 60

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sentiment_pipeline = pipeline("text-classification", model="tabularisai/multilingual-sentiment-analysis")

HTML_TAGS_PATTERN = re.compile('<.*?>')

TEMP_MAPPING = {
    'very negative': -1.0,
    'negative': -0.6,
    'neutral': 0.0,
    'very positive': 1.0,
    'positive': 0.6
}

# --- FUNKCJE POMOCNICZE ---

def calculate_temperature(label, score):
    # zamienia etykietę tekstową na wartość liczbową (-1.0 do 1.0).
    # mnoży wynik przez pewność modelu (score).

    label_lower = label.lower()
    base_temp = 0.0
    
    for key, val in TEMP_MAPPING.items():
        if key in label_lower:
            base_temp = val
            break
            
    return base_temp * score

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

def load_cache():
    if not os.path.exists(CACHE_FILE):
        return None
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_cache(data):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def is_cache_valid(cache):
    if not cache:
        return False
    return (time.time() - cache["timestamp"]) < CACHE_TTL_SECONDS

def get_processed_news():
    cache = load_cache()
    if is_cache_valid(cache):
        return cache["data"]

    with open("feeds.json", "r", encoding="utf-8") as f:
        FEEDS = json.load(f)

    all_news = []

    for feed in FEEDS:
        parsed = feedparser.parse(feed["url"])
        for entry in parsed.entries[:NEWS_COUNT]:
            raw_summary = entry.get('summary', '')
            clean_summary_text = clean_html(raw_summary)
            full_text = f"{entry.title}. {clean_summary_text}"

            # --- ANALIZA SENTYMENTU ---
            result = sentiment_pipeline(full_text, truncation=True, max_length=512)[0]
            label = result['label']
            score = result['score']
            temperature = calculate_temperature(label, score)
            all_news.append({
                "title": entry.title,
                "link": entry.link,
                "published": entry.get('published', "Brak daty"),
                "summary": clean_summary_text,
                "source": feed.get("name", "Nieznane źródło"),
                "region": feed.get("region", "Polska"),
                "category": feed.get("category", "Ogólne"),
                "sentiment_label": label,
                "temperature": temperature
            })

    save_cache({
        "timestamp": time.time(),
        "data": all_news
    })

    return all_news

# --- ENDPOINTY ---

@app.get("/rss")
def read_rss():
    """Endpoint dla widoku LISTY newsów"""
    return get_processed_news()

@app.get("/map-data")
def read_map_data():
    """Endpoint dla widoku MAPY"""
    news_list = get_processed_news()
    
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