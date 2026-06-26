<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NexTrack - IT Intern Monitoring System

NexTrack is a comprehensive management system for IT interns, featuring real-time attendance tracking, task management, DTR generation, and administrative reporting.

---

## 🚀 Getting Started (Run Locally)

### 1. Prerequisites
*   **Node.js**: [Download Node.js](https://nodejs.org/)
*   **XAMPP**: [Download XAMPP](https://www.apachefriends.org/) (Required for MySQL database)

### 2. Database Setup
1.  Open **XAMPP Control Panel** and start **MySQL**.
2.  Open **phpMyAdmin** at `http://localhost/phpmyadmin`.
3.  Create a new database named **`intern_track`**.
4.  *The application will automatically create all required tables upon first launch.*

### 3. Installation
Open your terminal (PowerShell or CMD) in the project root:
```powershell
npm install
```
> [!TIP]
> **Windows Users**: If you get a "SecurityError" regarding `.ps1` scripts, use `npm.cmd install` instead.

### 4. Run the Program
Launch the backend and frontend simultaneously:
```powershell
npm run dev
```
> [!TIP]
> **Windows Users**: If you get a "SecurityError", use `npm.cmd run dev` or `cmd /c "npm run dev"`.

### 5. Access the System
Once started, open your browser to:
**[http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Directory Structure
The project has been organized for better scalability:
*   `server/` - Backend Express server logic.
*   `src/pages/` - UI components grouped by feature (`admin`, `attendance`, `auth`).
*   `src/services/` - API and Database connection logic.
*   `src/utils/` - Shared helper functions (Date formatting, attendance math).
*   `docs/` - Additional documentation and migration guides.

---

## 🛠️ Technology Stack
*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
*   **Backend**: Node.js, Express, Knex.js.
*   **Database**: MySQL (via XAMPP).
