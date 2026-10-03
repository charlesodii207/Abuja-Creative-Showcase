# app/routes/traffic.py
#
# Site traffic tracking:
#   POST /track          public  - called by the website on every page view
#   GET  /admin/traffic  admin   - powers the Traffic page in the dashboard

import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.dependencies import require_permission
from app.permissions import SENIOR_ROLES

router = APIRouter(tags=["traffic"])

WAT = timezone(timedelta(hours=1))  # Nigeria, same convention as /admin/stats

SOCIAL_SOURCES = {"facebook", "instagram", "x", "linkedin", "tiktok", "whatsapp", "youtube"}
OWN_HOSTS = ("africacreativeshowcase.com",)

UTM_ALIASES = {
    "twitter": "x", "fb": "facebook", "ig": "instagram", "insta": "instagram",
    "wa": "whatsapp", "yt": "youtube", "li": "linkedin",
}

# (domain, source). A domain ending in "." matches anywhere in the host (google.*).
REFERRER_HOSTS = [
    ("facebook.com", "facebook"), ("fb.com", "facebook"),
    ("instagram.com", "instagram"),
    ("t.co", "x"), ("twitter.com", "x"), ("x.com", "x"),
    ("linkedin.com", "linkedin"), ("lnkd.in", "linkedin"),
    ("tiktok.com", "tiktok"),
    ("whatsapp.com", "whatsapp"), ("wa.me", "whatsapp"),
    ("youtube.com", "youtube"), ("youtu.be", "youtube"),
    ("google.", "google"),
]

# Crawlers and link-preview fetchers (WhatsApp/Facebook fetch your page
# when someone pastes a link — those aren't real visitors).
BOT_PATTERN = re.compile(
    r"bot|crawl|spider|slurp|preview|facebookexternalhit|^whatsapp/|headless",
    re.I,
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TrackPayload(BaseModel):
    path: str
    referrer: str | None = None
    utm_source: str | None = None
    is_landing: bool = False


class TrafficVisitOut(BaseModel):
    id: str
    created_at: datetime
    ip: str
    path: str
    source: str
    country: str | None
    device: str | None


class TopPage(BaseModel):
    path: str
    views: int
    unique_visitors: int


class TrafficResponse(BaseModel):
    total_visits: int
    unique_visitors: int
    social_clicks: int
    by_source: dict[str, int]
    top_pages: list[TopPage]
    recent_visits: list[TrafficVisitOut]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _client_ip(request: Request) -> str:
    # Behind a proxy (Render, Railway, Nginx, Cloudflare) the real visitor
    # IP is the first entry in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:45]
    return (request.client.host if request.client else "unknown")[:45]


def classify_source(utm_source: str | None, referrer: str | None) -> tuple[str, str | None]:
    """Returns (source, referrer_host). A utm_source tag always wins,
    because many social apps hide the referrer."""
    host = None
    if referrer:
        host = (urlparse(referrer).hostname or "").lower()[:120] or None

    if utm_source:
        cleaned = re.sub(r"[^a-z0-9_-]", "", utm_source.lower())[:40]
        if cleaned:
            return UTM_ALIASES.get(cleaned, cleaned), host

    if not host:
        return "direct", None

    if any(host == d or host.endswith("." + d) for d in OWN_HOSTS):
        return "direct", host

    for domain, name in REFERRER_HOSTS:
        if domain.endswith("."):
            if domain in host:
                return name, host
        elif host == domain or host.endswith("." + domain):
            return name, host

    return "other", host


def _device(user_agent: str) -> str:
    ua = user_agent.lower()
    if "ipad" in ua or "tablet" in ua:
        return "tablet"
    if "mobi" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    return "desktop"


def _country(request: Request) -> str | None:
    # Cloudflare adds this header automatically. Without Cloudflare it
    # stays empty until a GeoIP lookup is added.
    code = (request.headers.get("cf-ipcountry") or "").upper()
    return code if len(code) == 2 and code.isalpha() and code not in ("XX", "T1") else None


def _mask_ip(ip: str) -> str:
    """Regular admins only see the start of each address."""
    if ":" in ip:
        return ":".join(ip.split(":")[:2]) + ":••••"
    parts = ip.split(".")
    return ".".join(parts[:2]) + ".•••.•••" if len(parts) == 4 else "•••"


def _range_start(range_: str) -> datetime:
    now = datetime.now(timezone.utc)
    if range_ == "today":
        midnight_wat = now.astimezone(WAT).replace(hour=0, minute=0, second=0, microsecond=0)
        return midnight_wat.astimezone(timezone.utc)
    return now - timedelta(days=7 if range_ == "7d" else 30)


# ---------------------------------------------------------------------------
# POST /track  (public)
# ---------------------------------------------------------------------------

@router.post("/track", status_code=202)
def track(payload: TrackPayload, request: Request, db: Session = Depends(get_db)):
    user_agent = request.headers.get("user-agent", "")
    path = payload.path.split("?")[0][:300]

    # Silently ignore bots, link previews and anything that isn't a real page.
    if BOT_PATTERN.search(user_agent) or not path.startswith("/") or path.startswith("/admin"):
        return {"ok": True}

    source, referrer_host = classify_source(payload.utm_source, payload.referrer)

    db.add(
        models.SiteVisit(
            ip=_client_ip(request),
            path=path,
            source=source,
            referrer_host=referrer_host,
            country=_country(request),
            device=_device(user_agent),
            is_landing=payload.is_landing,
        )
    )
    db.commit()

    return {"ok": True}


# ---------------------------------------------------------------------------
# GET /admin/traffic  (admins only)
# ---------------------------------------------------------------------------

@router.get("/admin/traffic", response_model=TrafficResponse)
def get_traffic(
    range: str = Query(default="7d", pattern="^(today|7d|30d)$"),
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission("traffic")),
):
    in_range = models.SiteVisit.created_at >= _range_start(range)
    see_full_ip = admin.role.value in SENIOR_ROLES

    total_visits = db.query(func.count(models.SiteVisit.id)).filter(in_range).scalar() or 0
    unique_visitors = (
        db.query(func.count(distinct(models.SiteVisit.ip))).filter(in_range).scalar() or 0
    )

    # "Where visitors come from" counts landings only, so a visitor who
    # reads five pages is one click from Instagram, not five.
    by_source = dict(
        db.query(models.SiteVisit.source, func.count(models.SiteVisit.id))
        .filter(in_range, models.SiteVisit.is_landing.is_(True))
        .group_by(models.SiteVisit.source)
        .all()
    )
    social_clicks = sum(n for src, n in by_source.items() if src in SOCIAL_SOURCES)

    page_rows = (
        db.query(
            models.SiteVisit.path,
            func.count(models.SiteVisit.id),
            func.count(distinct(models.SiteVisit.ip)),
        )
        .filter(in_range)
        .group_by(models.SiteVisit.path)
        .order_by(func.count(models.SiteVisit.id).desc())
        .limit(8)
        .all()
    )

    recent = (
        db.query(models.SiteVisit)
        .filter(in_range)
        .order_by(models.SiteVisit.created_at.desc())
        .limit(200)
        .all()
    )

    return TrafficResponse(
        total_visits=total_visits,
        unique_visitors=unique_visitors,
        social_clicks=social_clicks,
        by_source=by_source,
        top_pages=[TopPage(path=p, views=v, unique_visitors=u) for p, v, u in page_rows],
        recent_visits=[
            TrafficVisitOut(
                id=str(v.id),
                created_at=v.created_at,
                ip=v.ip if see_full_ip else _mask_ip(v.ip),
                path=v.path,
                source=v.source,
                country=v.country,
                device=v.device,
            )
            for v in recent
        ],
    )