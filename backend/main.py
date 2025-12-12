from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import feedparser
from transformers import pipeline
import re
import html

# --- KONFIGURACJA I STAŁE ---

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

# --- ENDPOINTY ---
@app.get("/rss")
def fetch_rss():
    with open("feeds.json", "r", encoding="utf-8") as f:
        FEEDS = json.load(f)

    all_news = []

    for feed in FEEDS:
        parsed = feedparser.parse(feed["url"])
        for entry in parsed.entries[:3]:
            raw_summary = entry.get('summary', '')
            clean_summary_text = clean_html(raw_summary)
            
            full_text = f"{entry.title}. {clean_summary_text}"

            # --- ANALIZA SENTYMENTU ---

            result = sentiment_pipeline(full_text, truncation=True, max_length=512)[0]
            
            label = result['label']
            score = result['score']
            temperature = calculate_temperature(label, score)
                
            # --- BUDOWANIE WYNIKU ---
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

    return all_news