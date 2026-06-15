# IslamicFinance OS

### Open-Source Ethical Finance Platform | منصة التمويل الأخلاقي مفتوحة المصدر

> **No interest (riba). No exploitation. Just community.**
>
> **لا ربا. لا استغلال. مجتمع فقط.**

---

## Why Islamic Finance?

### لماذا التمويل الإسلامي؟

Conventional banking is built on interest (riba/ربا) — the borrower always pays more than they received. This creates systemic inequality where capital grows by extracting from those who need it most.

**Islamic finance** replaces interest with ethical alternatives rooted in risk-sharing, mutual aid, and real economic activity:

- **No guaranteed return** — investors share risk with entrepreneurs
- **No exploitation** — borrowers repay exactly what they borrowed
- **Community-first** — savings groups (tontines) build collective wealth
- **Full transparency** — every transaction is auditable on-chain

النظام المصرفي التقليدي مبني على الفائدة (الربا) — يدفع المقترض دائمًا أكثر مما استلم. هذا يخلق عدم مساواة منهجية.

**التمويل الإسلامي** يستبدل الفائدة ببدائل أخلاقية قائمة على تقاسم المخاطر والتعاون والنشاط الاقتصادي الحقيقي.

---

## Products | المنتجات

### 1. Qard Hasan (قرض حسن) — Interest-Free Loan

A benevolent loan where the borrower returns **exactly** what they received. No interest, no fees. The lender earns spiritual reward (ajr), not profit.

- Borrower submits a request with amount and purpose
- Community members fund it collectively
- Borrower repays the exact amount over time
- Platform earns nothing — purely social good

### 2. Musharaka (مشاركة) — Profit-Sharing Partnership

A joint venture where investors and entrepreneurs share both **profit and loss** proportionally. No guaranteed returns — this is what makes it halal.

- Entrepreneur posts a project with target funding and expected profit
- Investors contribute capital proportionally
- Profits are distributed based on each investor's share
- Losses are shared proportionally too — real risk, real partnership

### 3. Tontine Digitale (جمعية) — Rotating Savings Group

A community savings circle (known as Jam'iyya/جمعية in Arabic, Tontine in French-speaking regions). Members contribute a fixed amount each month, and one member receives the full pot each cycle.

- Groups of 5-20 people
- Fixed monthly contribution
- Payout order determined by lottery at group formation
- Digital tracking ensures accountability and trust

---

## Architecture | الهندسة المعمارية

```
┌─────────────────────────────────────────────────────────┐
│                     USERS / المستخدمون                    │
│              (Browser — React + TypeScript)              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 FRONTEND (Port 3000)                     │
│          React + TypeScript + Tailwind CSS               │
│     i18n: English | العربية | Francais                   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Dashboard │ │Qard Hasan│ │Musharaka │ │  Tontine   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Port 8000)                      │
│                  FastAPI (Python)                        │
│                                                         │
│  ┌────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐  │
│  │  Auth  │ │   Qard   │ │ Musharaka │ │  Tontine   │  │
│  │  JWT   │ │  Router  │ │  Router   │ │  Router    │  │
│  └────────┘ └──────────┘ └───────────┘ └────────────┘  │
│                       │                                  │
│              ┌────────┴────────┐                         │
│              │  Hashgraph Audit │                        │
│              │    Service       │                        │
│              └─────────────────┘                         │
└───────┬─────────────────────────────────┬───────────────┘
        │                                 │
        ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│  PostgreSQL   │                 │     Redis     │
│  (Database)   │                 │  (Sessions)   │
└───────────────┘                 └───────────────┘
```

---

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Frontend   | React 18, TypeScript, Tailwind |
| Backend    | FastAPI (Python 3.12)          |
| Database   | PostgreSQL 16                  |
| Cache      | Redis 7                        |
| Auth       | JWT (python-jose + bcrypt)     |
| Audit      | Hashgraph SDK (Hedera)         |
| Containers | Docker + docker-compose        |
| i18n       | English, Arabic, French        |

---

## Quick Start | البدء السريع

### Prerequisites

- Docker and Docker Compose installed
- Git

### Run Locally

```bash
# Clone the repository
git clone https://github.com/your-org/IslamicFinanceOS.git
cd IslamicFinanceOS

# Copy environment variables
cp .env.example .env

# Build and start all services
docker-compose up --build

# The application will be available at:
#   Frontend: http://localhost:3000
#   Backend API: http://localhost:8000
#   API Docs: http://localhost:8000/docs
```

### Development

```bash
# Backend only
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only
cd frontend
npm install
npm run dev
```

---

## Database Schema | مخطط قاعدة البيانات

| Table                  | Description                            |
| ---------------------- | -------------------------------------- |
| `users`                | User accounts                          |
| `qard_hasan`           | Interest-free loan requests            |
| `qard_contributions`   | Individual lender contributions        |
| `musharaka`            | Profit-sharing partnership projects    |
| `musharaka_investments` | Individual investments in partnerships |
| `tontines`             | Rotating savings groups                |
| `tontine_members`      | Members with payout order              |
| `transactions`         | All financial movements + audit trail  |

---

## API Endpoints | نقاط الوصول

### Authentication

| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| POST   | `/auth/register` | Create account    |
| POST   | `/auth/login`    | Login (get JWT)   |
| GET    | `/auth/me`       | Current user info |

### Qard Hasan (Interest-Free Loan)

| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| POST   | `/qard/request`    | Request a loan         |
| GET    | `/qard/available`  | List pending requests  |
| POST   | `/qard/{id}/fund`  | Fund a loan            |
| POST   | `/qard/{id}/repay` | Repay (exact amount)   |

### Musharaka (Profit-Sharing)

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| POST   | `/musharaka/create`      | Create project       |
| GET    | `/musharaka/available`   | List open projects   |
| POST   | `/musharaka/{id}/invest` | Invest in project    |
| POST   | `/musharaka/{id}/profit` | Distribute profit    |

### Tontine Digitale (Rotating Savings)

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| POST   | `/tontine/create`     | Create savings group  |
| GET    | `/tontine/available`  | List forming groups   |
| POST   | `/tontine/{id}/join`  | Join a group          |
| POST   | `/tontine/{id}/pay`   | Monthly contribution  |
| GET    | `/tontine/{id}/status`| Cycle status          |

### Transactions

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| GET    | `/transactions/` | User's transaction history |

---

## Deploying for Your Country | النشر لبلدك

IslamicFinance OS is designed to be deployed by **any community, country, or organization** wanting to operate without interest.

1. **Fork this repository**
2. **Configure your `.env`** — set database credentials, JWT secret, and optional Hashgraph keys
3. **Customize translations** — add your local language in `frontend/src/i18n/`
4. **Deploy with Docker** — `docker-compose up -d` on any server
5. **Add your local currency** — modify amount display throughout the frontend

### Considerations for Production

- Use a proper secrets manager for JWT keys and database passwords
- Enable HTTPS with a reverse proxy (nginx/Caddy)
- Set up database backups
- Configure Hedera Hashgraph mainnet for immutable audit trails
- Add KYC/AML compliance as required by your jurisdiction

---

## Roadmap | خارطة الطريق

- [ ] Mobile app (React Native)
- [ ] Murabaha (cost-plus financing) product
- [ ] Ijara (leasing) product
- [ ] Sukuk (Islamic bonds) marketplace
- [ ] Multi-currency support
- [ ] Hedera Hashgraph mainnet integration
- [ ] KYC/AML compliance module
- [ ] Admin dashboard with analytics
- [ ] SMS notifications for Tontine cycles
- [ ] Sharia advisory board integration
- [ ] Microfinance mode for rural communities

---

## Islamic Finance Glossary | مصطلحات التمويل الإسلامي

| Term | Arabic | Meaning |
| --- | --- | --- |
| Riba | ربا | Interest/usury — strictly prohibited |
| Qard Hasan | قرض حسن | Benevolent/interest-free loan |
| Musharaka | مشاركة | Joint venture/partnership |
| Mudaraba | مضاربة | Silent partnership |
| Tontine/Jam'iyya | جمعية | Rotating savings group |
| Halal | حلال | Permissible |
| Haram | حرام | Prohibited |
| Ajr | أجر | Spiritual reward |
| Sharia | شريعة | Islamic law |
| Sukuk | صكوك | Islamic bonds |

---

## Contributing

Contributions are welcome. Please ensure:
- Code follows existing conventions
- All variables and comments are in English
- UI strings go through the i18n system
- No interest-based financial concepts are introduced

---

## License

MIT License — free for any community, country, or organization to use and modify.

---

<div align="center">

**IslamicFinance OS** — Built for communities, not corporations.

**نظام التمويل الإسلامي** — مبني للمجتمعات، وليس للشركات.

</div>
