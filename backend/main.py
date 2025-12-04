from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    url = "https://www.polsatnews.pl/rss/wszystkie.xml"
    feed = feedparser.parse(url)

    headlines = [
        {
            "title": item.title,
            "link": item.link,
            "date": item.get("published", "")
        }
        for item in feed.entries
    ]

    return {"headlines": headlines}
