from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import feedparser
from transformers import pipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sentiment_pipeline = pipeline("text-classification", model="tabularisai/multilingual-sentiment-analysis")


@app.get("/rss")
def fetch_rss():
    with open("feeds.json", "r", encoding="utf-8") as f:
        FEEDS = json.load(f)

    all_news = []

    for feed in FEEDS:
        parsed = feedparser.parse(feed["url"])
        for entry in parsed.entries:
            
            full_text = f"{entry.title}. {entry.summary}"

            result = sentiment_pipeline(full_text)[0]
            # zwraca obiekt z etykietą (Very Negative, Negative, Neutral, Positive, Very Positive) i wynikiem (pewność od 0 do 1)

            all_news.append({
                "title": entry.title,
                "link": entry.link,
                "published": entry.published,
                "summary": entry.summary,
                "source": feed["name"],
                "region": feed["region"],
                "category": feed["category"],
                "sentiment_label": result,
            })

    return all_news