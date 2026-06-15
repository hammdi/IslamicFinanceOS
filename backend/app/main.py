from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import (
    auth, wallet, qard, musharaka, tontine, murabaha, ijara,
    takaful, hawala, sukuk,
    zakat, waqf, sadaqa, screener, faraid, marketplace,
    creditscore, family, sulh, timebank, community, employee,
    transactions, notifications, dashboard, admin,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (for development; use Alembic in production)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="IslamicFinance OS",
    description=(
        "Open-source Islamic finance platform implementing Sharia-compliant "
        "financial products: Qard Hasan (interest-free loans), Musharaka "
        "(profit-sharing partnerships), and Tontine Digitale (rotating savings). "
        "No ribā (interest). No exploitation. Just community finance."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(qard.router)
app.include_router(musharaka.router)
app.include_router(tontine.router)
app.include_router(murabaha.router)
app.include_router(ijara.router)
app.include_router(zakat.router)
app.include_router(waqf.router)
app.include_router(sadaqa.router)
app.include_router(screener.router)
app.include_router(takaful.router)
app.include_router(hawala.router)
app.include_router(sukuk.router)
app.include_router(faraid.router)
app.include_router(marketplace.router)
app.include_router(creditscore.router)
app.include_router(family.router)
app.include_router(sulh.router)
app.include_router(timebank.router)
app.include_router(community.router)
app.include_router(transactions.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(employee.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": "IslamicFinance OS",
        "status": "running",
        "message": "Ethical finance for everyone — no ribā, no exploitation.",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
