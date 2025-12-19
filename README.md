# TourismPro - Tour Management System

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

4) **Accessing the app**: After deploy, Render gives a web URL. The frontend is served by Apache from the container; API endpoints live under `/api`. Example health: `GET /api/v1/hotels.php`.

Notes:
- Apache is configured to respect the Render-assigned `PORT`. No extra config is needed.
- If you prefer MySQL locally, set `DB_DRIVER=mysql` and run `db/setup.sql` on your MySQL instance.
