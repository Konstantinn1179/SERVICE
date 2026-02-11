# Status of Project "Auto Service Booking" (Ai Autoservice Kirov)

**Date:** 2026-02-02
**State:** Paused (Awaiting Client Feedback)

## 1. Project Overview
This is a web application for booking auto service appointments, designed to work as a Telegram Web App.
- **Frontend:** React, Vite, Tailwind CSS v4.
- **Backend:** Node.js, Express.
- **Database:** Supabase (PostgreSQL) -> *Planned migration to Timeweb Cloud DB (PostgreSQL + Prisma)*.
- **Integrations:** Telegram Bot API, Google Calendar (Current) -> *Planned Custom Calendar Module*.

## 2. Latest Architectural Decisions (2026-02-02)
- **Calendar Architecture:** Adopted a **Modular Monolith** approach. The calendar will be a module within the main application (embedded) rather than a separate microservice. This suits the single-tenant nature of the project.
- **Data Compliance (152-FZ):** Planned migration from Supabase to **Timeweb Cloud Managed Databases** (PostgreSQL) + **Prisma ORM**. This ensures data resides in Russia and allows for custom calendar logic.


## 2. What Works
- **Booking Form:** Users can enter Name, Phone, Car details, Date, Time, and Reason. Includes validation and 152-FZ consent.
- **Telegram Notifications:** Admin receives a notification for every new booking.
- **Database Storage:** Bookings are saved to Supabase (`car_bookings` table).
- **Google Calendar:** Events are automatically created in the connected Google Calendar.
- **Deployment Config:** The project is configured to run as a single Node.js app (Frontend is served statically by the backend).

## 3. Deployment Instructions (Timeweb Cloud)
The project is set up for **Timeweb Cloud Apps** as a **Node.js** application.

### Setup Steps on Timeweb:
1.  **Repository:** Connect the `SERVICE` repository (branch `main`).
2.  **Build Command:** `npm install` (Postinstall script will automatically build the frontend).
3.  **Start Command:** `npm start` (Runs `node server/server.cjs`).
4.  **Environment Variables:** You MUST add these in the Timeweb dashboard:
    - `TELEGRAM_BOT_TOKEN`: Your bot token.
    - `ADMIN_CHAT_ID`: Your Telegram Chat ID.
    - `SUPABASE_URL`: URL from Supabase dashboard.
    - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (secret) from Supabase.
    - `GOOGLE_CALENDAR_ID`: Your email address (e.g., `...gmail.com`).
    - `GOOGLE_SERVICE_ACCOUNT_JSON`: **Copy the entire content** of `server/service-account.json` here.

## 4. How to Resume Work (On New Machine)
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Konstantinn1179/SERVICE.git
    cd SERVICE
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Restore Secrets:**
    - Create a `.env` file in the root directory.
    - Create `server/service-account.json` if you want to test calendar locally (or use `.env`).
    - *Note:* You should have saved these files securely from the previous machine.
4.  **Run Locally:**
    ```bash
    npm run dev   # Starts Vite frontend
    # In another terminal:
    cd server && npm run dev # Starts Express backend
    ```

## 5. Recent Changes
- Migrated to a single `package.json` at the root to simplify deployment.
- Added `server/server.cjs` to serve static frontend files in production.
- Added `postinstall` script to build React app automatically.
- Fixed Telegram notification formatting (HTML mode).
- Implemented Google Calendar integration via Environment Variables (for cloud security).

## 7. Next Steps (Resume)
- [ ] **Await Client Feedback** on calendar architecture.
- [ ] **Deploy Current Version** to Timeweb Cloud (as is, with Google Calendar) for testing.
- [ ] **Migration Planning:** Initialize Prisma and design schema for the custom calendar table (PostgreSQL).

