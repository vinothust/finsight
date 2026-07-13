from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FinSight API")

from app.routers import dashboard, insights, scorecards, uploads

app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(scorecards.router)
app.include_router(insights.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
