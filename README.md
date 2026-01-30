# Auto Service Booking App

A React-based booking application for Auto Service, integrated with Telegram and Google Calendar.

## Features
- 🚗 Car Booking Form (Name, Phone, Car Model, Issue)
- 📅 Google Calendar Integration (Auto-create events)
- 🤖 Telegram Admin Notifications
- ⚡ Vite + Tailwind CSS v4
- 🗄️ Supabase Backend

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account
- Telegram Bot Token
- Google Cloud Service Account (for Calendar)

### Installation

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/Konstantinn1179/SERVICE.git
    cd SERVICE
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    # Backend Variables
    PORT=5000
    TELEGRAM_BOT_TOKEN=your_bot_token
    ADMIN_CHAT_ID=your_chat_id
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    GOOGLE_CALENDAR_ID=your_email@gmail.com
    # GOOGLE_SERVICE_ACCOUNT_JSON=... (Optional for local, required for cloud)
    ```

4.  **Run Locally:**
    ```bash
    # Terminal 1: Frontend
    npm run dev

    # Terminal 2: Backend
    cd server
    node index.js
    ```

## Deployment (Timeweb Cloud)
This project is configured for easy deployment as a Node.js App.
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Ensure all environment variables are set in the dashboard.
