# Local Deployment & SQL Migration Guide

This guide describes how to transfer the project to your local machine using Visual Studio Code and XAMPP (MySQL).

## Prerequisites
1. **Node.js**: Install from [nodejs.org](https://nodejs.org/).
2. **Visual Studio Code**: Install from [code.visualstudio.com](https://code.visualstudio.com/).
3. **XAMPP**: Install from [apachefriends.org](https://www.apachefriends.org/).

## Step 1: Set up the Database (XAMPP)
1. Open **XAMPP Control Panel**.
2. Start **Apache** and **MySQL**.
3. Click the **Admin** button next to MySQL to open **phpMyAdmin**.
4. Create a new database named `intern_track`.

## Step 2: Configure the Project
1. Open the project folder in **Visual Studio Code**.
2. Update the database connection in `src/lib/db.ts` to use MySQL instead of SQLite.

Change the `db` initialization in `src/lib/db.ts`:
```typescript
const db = knex({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '', // Default XAMPP password is empty
    database: 'intern_track'
  }
});
```

## Step 3: Install Dependencies
Open the terminal in VS Code and run:
```bash
npm install
```

## Step 4: Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Project Settings > General > Your apps.
3. Copy the `firebaseConfig` object into `/src/lib/firebase-applet-config.json` (or verify it exists).
4. **Important**: Add `http://localhost:3000` to your Firebase Authentication > Settings > Authorized Domains.

## Step 5: Start the Application
Run the following command in your terminal:
```bash
npm run dev
```
The server will start at `http://localhost:3000`. On the first run, it will automatically create the necessary SQL tables.

## Project Structure Changes
- **Backend**: An Express server handles all data requests in `server.ts`.
- **API Service**: `src/lib/apiService.ts` is the single point of contact for the frontend.
- **Polling**: Instead of real-time Firestore listeners, the app now polls the server every 5-10 seconds to keep data updated.

## Summary of SQL Schema
The system uses `knex` for migrations/initialization. The main tables are:
- `users`: Profiles, roles, and department info.
- `tasks`: Task descriptions, assignments, and statuses.
- `shifts`: Clock-in/out attendance records.
- `time_logs`: Specific work logs for tasks.
- `approvals`: Audit history for log reviews.
