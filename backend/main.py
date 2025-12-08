from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import feedparser

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/rss")
def fetch_rss():
    with open("feeds.json", "r", encoding="utf-8") as f:
        FEEDS = json.load(f)

    all_news = []

    for feed in FEEDS:
        parsed = feedparser.parse(feed["url"])
        for entry in parsed.entries:
            all_news.append({
                "title": entry.title,
                "link": entry.link,
                "published": entry.published,
                "summary": entry.summary,
                "source": feed["name"],
                "region": feed["region"],
                "category": feed["category"]
            })

    return all_news
