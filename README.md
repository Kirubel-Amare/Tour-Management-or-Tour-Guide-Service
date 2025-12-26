# TourismPro - Tour Management System

## CRUD Endpoints Plan by Role

### Admin
- Users: Create, Read (list), Update, Delete
- Hotels: Create, Read, Update, Delete
- Places: Create, Read, Update, Delete
- Restaurants: Create, Read, Update, Delete
- Tours: Create, Read, Update, Delete
- Bookings: Read, Update, Delete
- Reviews: Read, Delete

### Manager
- Hotels: Create, Read, Update, Delete (for managed hotels)
- Bookings: Create, Read, Update, Delete (for managed hotels)
- Tours: Create, Read, Update, Delete (for managed tours)
- Restaurants: Create, Read, Update, Delete (for managed restaurants)

### User
- Profile: Read, Update, Delete
- Bookings: Create, Read, Update, Delete (own)
- Reviews: Create, Read, Update, Delete (own)

---
Missing endpoints and UI will be implemented for all above operations.

A web-based platform connecting tourists with expert local guides. This application allows users to browse tours, book adventures, and enables guides to manage their tour offerings.

## 🚀 Getting Started

### Prerequisites

- PHP 8.0 or higher
- A web browser

### Installation & Run

1.  **Clone or Download** the repository.
2.  **Navigate** to the project directory in your terminal.
3.  **Ensure Write Permissions**: The application uses JSON files for data storage. Make sure the `data/` directory is writable.
    ```bash
    chmod -R 777 data
    ```
4.  **Start the Server**:
    ```bash
    php -S 0.0.0.0:8000
    ```
5.  **Access the Application**:
    Open your browser and visit: [http://localhost:8000/public/index.html](http://localhost:8000/public/index.html)

## ✨ Features

-   **Public Portal**:
    -   **Home Page**: Featured destinations and testimonials.
    -   **Tours Listing**: Browse available tours with filtering.
    -   **About Us**: Company story and team.

-   **User Roles**:
    -   **Tourist**: Book tours, view booking history, manage profile.
    -   **Tour Guide**: Create and manage tours, view bookings, track revenue.

-   **Dashboard**:
    -   Interactive dashboards for both Tourists and Guides.
    -   Real-time statistics and activity feeds (simulated).

## 🛠️ Tech Stack

-   **Backend**: PHP (Native)
-   **Frontend**: HTML5, CSS3 (Custom Glassmorphism Design), JavaScript (Vanilla)
-   **Database**: JSON-based flat file system (No SQL database required for easy setup)

## 📂 Project Structure

-   `api/`: PHP scripts handling backend logic and data processing.
-   `config/`: Configuration files (Database connection class).
-   `data/`: JSON files storing Users, Tours, and Bookings.
-   `models/`: PHP classes representing data entities.
-   `public/`: Frontend files (HTML, CSS, JS, Images).

## 📝 Demo Credentials

You can use the built-in "Try Demo Accounts" feature on the login page, or use:

-   **Tourist**: `tourist@demo.com` / `demopass123`
-   **Guide**: `guide@demo.com` / `demopass123`

## ☁️ Deploying on Render (free tier)

This repo includes a `render.yaml` blueprint and `Dockerfile` so you can deploy the PHP API, static frontend, and Postgres database together on Render's free tier.

1) **Repo connected to Render**: Push this repo to GitHub and create a new Blueprint on Render. Render will auto-detect `render.yaml` and provision:
    - `tour-management-db` (Postgres, free plan)
    - `tour-management-web` (Docker web service running Apache/PHP)

2) **Environment variables**: Render injects `DATABASE_URL` from the Postgres service into the web service automatically. For local dev, copy `.env.example` to `.env` and set `DB_*` values.

3) **Database migration**: Once the Postgres service is ready, run the migration from the web service shell (or Render dashboard):
    ```bash
    psql "$DATABASE_URL" -f db/setup_postgres.sql
    ```
    This creates tables and seeds demo data. Re-run safely; it uses `IF NOT EXISTS`.

4) **Seed demo users & tours**:
     - From the web service shell or locally (with `DATABASE_URL` set):
         ```bash
         php db/seed.php
         ```
     - Demo accounts:
         - admin: `admin@demo.com` / `demopass123`
         - manager: `manager@demo.com` / `demopass123`
         - customer: `customer@demo.com` / `demopass123`

### Using External Postgres URL (local machine)

- From the Render Postgres service, copy the **External Database URL** (will look like `postgresql://...virginia-postgres.render.com/...`).
- Append `?sslmode=require` and run:
    ```bash
    export DATABASE_URL='postgresql://<user>:<pass>@<external-host>:5432/<db>?sslmode=require'
    psql "$DATABASE_URL" -f db/setup_postgres.sql
    ```
- If you created `bookings` earlier with `tourist_id`, align the schema:
    ```bash
    psql "$DATABASE_URL" -f db/migrations/fix_bookings_user_id.sql
    ```

4) **Accessing the app**: After deploy, Render gives a web URL. The frontend is served by Apache from the container; API endpoints live under `/api`. Example health: `GET /api/v1/hotels.php`.

Notes:
- Apache is configured to respect the Render-assigned `PORT`. No extra config is needed.
- If you prefer MySQL locally, set `DB_DRIVER=mysql` and run `db/setup.sql` on your MySQL instance.

## 🔐 API Authentication

All endpoints under `api/v1/*.php` require the header `X-API-KEY`.

- Default local key: `demo-api-key`.
- Server key is read from `API_REVIEW_KEY` (or `REVIEW_API_KEY`) environment variable.

Set it in your shell when running PHP locally:

```bash
export API_REVIEW_KEY=demo-api-key
```

If you deploy with a custom key, update your frontend to send it (see `public/js/services.js` and `public/js/tours.js`).

### Taxi external API

The taxi endpoint reads OpenRouteService settings from env:

- `EXTERNAL_TAXI_API` (e.g. `https://api.openrouteservice.org/v2/directions/driving-car`)
- `EXTERNAL_TAXI_API_KEY` (your ORS key)

For local mock mode, omit these or set `APP_ENV=local`. In non-local environments, both must be set.

### External Hotel Management API (Group 6)

We consume a partner hotel service (Group 6). Full docs are in `docs/hotel_management_api.md` with endpoints, examples, and auth notes. Base production URL: `http://hotelmanagemt.infinityfreeapp.com/api`.

Local proxy endpoints you can call from frontend/backend:
- `GET /api/integrations/hotels.php` (passes query params to partner `hotels.php`)
- `GET /api/integrations/rooms.php?hotel_id=...&check_in=YYYY-MM-DD&check_out=YYYY-MM-DD`
- `POST /api/integrations/hotel_bookings.php` (requires env `HOTEL_API_TOKEN`)

Environment variables:
- `HOTEL_API_BASE_URL` (default: `http://hotelmanagemt.infinityfreeapp.com/api`)
- `HOTEL_API_TOKEN` (JWT/Bearer from partner for bookings)
