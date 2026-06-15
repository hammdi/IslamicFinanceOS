# IslamicFinance OS

### The World's Most Complete Open-Source Islamic Finance Platform

### منصة التمويل الإسلامي الأكثر اكتمالاً في العالم — مفتوحة المصدر

> **No interest. No exploitation. Just community.**
> **لا ربا. لا استغلال. مجتمع فقط.**

---

## What is IslamicFinance OS?

A full-stack, production-ready platform implementing **20+ Sharia-compliant financial products** that can replace traditional banking for any community or country.

**134 API endpoints | 27 modules | 46 database tables | 3 languages**

---

## Products

### Islamic Finance (7 products)

| Product | Arabic | Description |
|---------|--------|-------------|
| **Qard Hasan** | قرض حسن | Interest-free benevolent loans |
| **Musharaka** | مشاركة | Profit & loss sharing partnerships |
| **Tontine Digitale** | جمعية | Rotating community savings groups |
| **Murabaha** | مرابحة | Cost-plus financing with installments |
| **Ijara** | إجارة | Islamic leasing with purchase option |
| **Takaful** | تكافل | Mutual micro-insurance (community-voted claims) |
| **Sukuk** | صكوك | Asset-backed Islamic bonds |

### Charity & Giving (3 products)

| Product | Arabic | Description |
|---------|--------|-------------|
| **Zakat** | زكاة | Obligatory charity calculator (2.5% of wealth) |
| **Waqf** | وقف | Permanent community endowments |
| **Sadaqa** | صدقة | Transparent voluntary charity campaigns |

### Tools & Services (5 products)

| Product | Arabic | Description |
|---------|--------|-------------|
| **Hawala** | حوالة | Cross-border money transfer (0.5% fee) |
| **Halal Screener** | فاحص حلال | Sharia compliance checker for stocks |
| **Faraid** | فرائض | Islamic inheritance calculator (Quran-based) |
| **Marketplace** | سوق | Halal buy/sell marketplace |
| **Time Banking** | بنك الوقت | Skill exchange without money (1h = 1 credit) |

### Community & Governance (5 features)

| Feature | Arabic | Description |
|---------|--------|-------------|
| **Shura** | شورى | Community governance voting (DAO-like) |
| **Sulh** | صلح | Islamic dispute mediation (3 mediators + blockchain) |
| **Credit Score** | تقييم | Halal trust score (0-1000, not debt-based) |
| **Family Finance** | عائلة | Savings goals (Hajj, wedding, education) |
| **Community Impact** | مجتمع | Impact metrics & success stories |

### Platform Infrastructure

| Module | Description |
|--------|-------------|
| **Wallet** | Deposit, withdraw, transfer between users |
| **Notifications** | Real-time alerts with unread count |
| **Employee Portal** | KYC verification, support tickets, campaign approval, audit logs |
| **Admin Dashboard** | Platform stats, user management, pending approvals |
| **Audit Trail** | Blockchain hash viewer (Hashgraph) |
| **Settings** | Dark mode, language, profile, security |
| **Help Center** | Product guides, FAQ, report a problem |
| **Landing Page** | Public marketing page with feature showcase |

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (Port 3000)                      │
│            React 18 + TypeScript + Tailwind CSS              │
│   Sidebar Navigation | Dark Mode | i18n (EN/AR/FR) | RTL    │
│                                                              │
│   20+ Pages | PageHeader | InfoLabel | Animations            │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API (134 endpoints)
                       ▼
┌────────────────────────────────────────────────────────────┐
│                    BACKEND (Port 8000)                       │
│                   FastAPI (Python 3.12)                       │
│                                                              │
│   27 Router Modules | JWT Auth | Hashgraph Audit             │
│   Employee Portal | KYC | Support Tickets | Credit Score     │
└───────┬────────────────────────────────────┬─────────────────┘
        │                                    │
        ▼                                    ▼
┌───────────────┐                    ┌───────────────┐
│  PostgreSQL   │                    │     Redis     │
│  46 Tables    │                    │   Sessions    │
└───────────────┘                    └───────────────┘
```

---

## Quick Start

```bash
git clone https://github.com/hammdi/IslamicFinanceOS.git
cd IslamicFinanceOS
cp .env.example .env
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT + bcrypt |
| Audit | Hashgraph SDK (Hedera) |
| Containers | Docker + docker-compose |
| i18n | English, Arabic (RTL), French |

---

## API Overview (134 endpoints)

| Module | Endpoints | Key Operations |
|--------|-----------|---------------|
| Auth | 3 | register, login, me |
| Wallet | 4 | balance, deposit, withdraw, transfer |
| Qard Hasan | 6 | request, fund, repay, my, available |
| Musharaka | 6 | create, invest, profit, my, available |
| Tontine | 7 | create, join, pay, status, my |
| Murabaha | 6 | request, approve, pay, schedule |
| Ijara | 6 | request, approve, pay, purchase |
| Takaful | 7 | create, join, contribute, claim, vote |
| Hawala | 4 | send, track, collect, my |
| Sukuk | 5 | create, buy, distribute-returns |
| Zakat | 4 | calculate, distribute, history |
| Waqf | 5 | create, donate, my, available |
| Sadaqa | 6 | campaigns, donate, update, transparency |
| Screener | 4 | check, halal-list, all |
| Faraid | 2 | calculate, history |
| Marketplace | 5 | listings, buy, propose, vote |
| Credit Score | 2 | my, user |
| Family | 4 | goals, contribute, withdraw |
| Sulh | 5 | disputes, volunteer, resolve |
| Time Bank | 6 | offers, request, complete, balance |
| Community | 4 | impact, stories, like |
| Employee | 16 | dashboard, KYC, tickets, logs, team |
| Dashboard | 1 | comprehensive stats |
| Notifications | 4 | list, unread-count, read, read-all |
| Admin | 5 | stats, users, verify, approvals |

---

## Deploy for Your Country

1. Fork this repository
2. Configure `.env` with your database and JWT secrets
3. Add your local language in `frontend/src/i18n/`
4. Set your local currency
5. `docker-compose up -d` on any server
6. Configure Hedera Hashgraph mainnet for production audit trails

---

## Islamic Finance Glossary

| Term | Arabic | Meaning |
|------|--------|---------|
| Riba | ربا | Interest/usury — prohibited |
| Qard Hasan | قرض حسن | Benevolent interest-free loan |
| Musharaka | مشاركة | Joint venture partnership |
| Murabaha | مرابحة | Cost-plus financing |
| Ijara | إجارة | Islamic leasing |
| Takaful | تكافل | Islamic mutual insurance |
| Sukuk | صكوك | Islamic bonds |
| Hawala | حوالة | Money transfer network |
| Zakat | زكاة | Obligatory charity (2.5%) |
| Waqf | وقف | Permanent endowment |
| Sadaqa | صدقة | Voluntary charity |
| Faraid | فرائض | Islamic inheritance law |
| Sulh | صلح | Mediation/reconciliation |
| Shura | شورى | Consultation/governance |
| Halal | حلال | Permissible |
| Haram | حرام | Prohibited |
| Nisab | نصاب | Minimum wealth threshold for Zakat |

---

## License

MIT License — free for any community, country, or organization.

---

<div align="center">

**IslamicFinance OS** — Built for communities, not corporations.

**نظام التمويل الإسلامي** — مبني للمجتمعات، وليس للشركات.

</div>
