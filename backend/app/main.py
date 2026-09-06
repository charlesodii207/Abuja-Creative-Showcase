from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.visitor import router as visitor_router
from app.routes.exhibitor import router as exhibitor_router
from app.routes.speaker import router as speaker_router
from app.routes.press import router as press_router
from app.routes.pitcher import router as pitcher_router
from app.routes.lookup import router as lookup_router
from app.routes.admin import router as admin_router
from app.routes.sponsors import router as sponsors_router
from app.routes.contact import router as contact_router

app = FastAPI(title="Abuja Creative Showcase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visitor_router)
app.include_router(exhibitor_router)
app.include_router(speaker_router)
app.include_router(press_router)
app.include_router(pitcher_router)
app.include_router(lookup_router)
app.include_router(admin_router)
app.include_router(sponsors_router)
app.include_router(contact_router)


@app.get("/")
def root():
    return {"status": "ok", "environment": settings.environment}