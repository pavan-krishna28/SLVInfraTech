# SLV Tech Infra — Website & Admin System

## 📁 Folder Structure

```
slv-tech-infra/
├── index.html              ← Main website (all-in-one frontend)
├── README.md
└── backend/
    ├── main.py             ← FastAPI backend server
    ├── requirements.txt    ← Python dependencies
    ├── slv_infra.db        ← SQLite database (auto-created)
    └── uploads/            ← Media upload directory (auto-created)
```

---

## 🚀 Quick Start

### Frontend Only
Simply open `index.html` in a browser — the site is fully functional with demo data built in.

### Full Stack (with Backend)

**1. Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**2. Start the backend server:**
```bash
uvicorn main:app --reload --port 8000
```

**3. Open the frontend:**
- Open `index.html` in browser
- Admin panel accessible via ⚙ button (bottom-right)

---

## 📋 Database Schema

### `projects`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Project name |
| category | TEXT | residential/commercial/infrastructure |
| description | TEXT | Full description |
| location | TEXT | Site address |
| status | TEXT | ongoing/completed |
| year | INTEGER | Project year |
| cover_image | TEXT | Cover image path |
| created_at | DATETIME | Creation timestamp |

### `project_media`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| project_id | INTEGER | FK to projects |
| file_path | TEXT | Media file path |
| media_type | TEXT | image/video |
| caption | TEXT | Optional caption |
| uploaded_at | DATETIME | Upload timestamp |

### `daily_updates`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| title | TEXT | Update title |
| description | TEXT | Full description |
| tag | TEXT | Residential/Commercial/Infrastructure |
| project_id | INTEGER | Optional FK to projects |
| published | BOOLEAN | Published flag |
| created_at | DATETIME | Creation timestamp |

### `progress_updates`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| project_id | INTEGER | Optional FK |
| day_label | TEXT | Day 1 - Jan 15, 2025 |
| title | TEXT | Milestone title |
| description | TEXT | Work details |
| completion_pct | INTEGER | 0-100% completion |
| created_at | DATETIME | Creation timestamp |

### `contact_inquiries`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Client name |
| phone | TEXT | Phone number |
| service | TEXT | Service requested |
| message | TEXT | Message body |
| status | TEXT | new/contacted/closed |
| created_at | DATETIME | Submission timestamp |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| PUT | /api/projects/{id} | Update project |
| DELETE | /api/projects/{id} | Delete project |
| POST | /api/projects/{id}/media | Upload project media |
| GET | /api/updates | List daily updates |
| POST | /api/updates | Post new update |
| DELETE | /api/updates/{id} | Delete update |
| POST | /api/updates/{id}/media | Upload update media |
| GET | /api/progress | List progress updates |
| POST | /api/progress | Add progress entry |
| DELETE | /api/progress/{id} | Delete progress |
| POST | /api/contact | Submit contact form |
| GET | /api/contact | List all inquiries |

---

## 🎨 Website Features

- ✅ 3D hero scene with Three.js — crane + building constructed floor by floor on scroll
- ✅ Blueprint animation canvas in About section
- ✅ Parallax scrolling with camera motion
- ✅ Glassmorphism UI elements
- ✅ Services section (6 service cards)
- ✅ Filterable project gallery
- ✅ Daily updates blog section
- ✅ Construction progress timeline with animated bars
- ✅ Contact form with WhatsApp redirect
- ✅ Embedded Google Maps
- ✅ Floating WhatsApp button (both numbers)
- ✅ Admin panel (built into page, no login required)
- ✅ Construction loader animation
- ✅ Mobile responsive design
- ✅ Counter animations (75+ projects, 7 years, 500+ clients)
- ✅ Scroll-reveal animations throughout

---

## 📞 Contact Info

- **Punith Venkatesh** — +91 74111 13053
- **Venkatesh S** — +91 98808 17909
- **WhatsApp:** Both numbers linked throughout site

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **3D Engine:** Three.js r128
- **Backend:** Python FastAPI
- **Database:** SQLite (upgradeable to PostgreSQL)
- **Fonts:** Bebas Neue, Rajdhani, Orbitron

---

*© 2025 SLV Tech Infra. Owners: Punith Venkatesh & Venkatesh S*
