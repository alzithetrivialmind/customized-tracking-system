# Hostinger Deployment Guide (EcoGreen Monolith)

This guide provides step-by-step instructions for deploying the **EcoGreen Tracking System** on **Hostinger Cloud Startup** using the monolithic Node.js + Express + SQLite architecture.

## 1. Prerequisites
- **Node.js Version**: 18.x or 20.x (Check in hPanel).
- **Domain/Subdomain**: Points to your Hostinger server.

## 2. Local Preparation
1.  **Build the Frontend**:
    ```bash
    npm run build
    ```
    This creates the `dist` folder in your project root.
2.  **Verify Root Structure**: Ensure these files are at the root:
    - `server.js`
    - `database.js`
    - `auth.js`
    - `package.json`
    - `dist/` (contains the Vite build)
    - `database/` (empty)
    - `uploads/` (empty)
    - `templates/` (Upload your master `.xlsx` here)
    - `exports/` (empty)

## 3. Upload to Hostinger
1.  Compress all the files/folders above into a `.zip`.
2.  Open **hPanel** -> **File Manager**.
3.  Upload the `.zip` to your project directory (e.g., `/public_html/tracking`).
4.  Extract the files.

## 4. Setup Node.js in hPanel
1.  Go to **hPanel** -> **Advanced** -> **Node.js**.
2.  **App Root**: Set this to your project folder.
3.  **App URL**: Set the domain/subdomain you want to use.
4.  **Application Mode**: Set to `production`.
5.  **App Startup File**: Set to `server.js`.
6.  **Environment Variables**:
    - `JWT_SECRET`: (Generate a long random string)
    - `PORT`: (Leave as default, Hostinger handles this)

## 5. Install Dependencies & Start
1.  In the Node.js manager, click **"NPM Install"**.
2.  Once finished, click **"Run Script"** and enter `start` (assuming `package.json` has `"start": "node server.js"`).
3.  Click **"Start App"**.

## 6. Verification
- Visit your URL. The **Login** screen should appear.
- **Login Credentials**: 
  - **Email**: `admin@ecogreen.com`
  - **Password**: `admin123`
- After login, you will be prompted to change the admin password for security.

## 7. Troubleshooting
- **Endless Loading**: Check the `logs` in the Hostinger Node.js manager. Ensure `sqlite3` was installed correctly.
- **Permissions**: Ensure the `/database`, `/uploads`, `/templates`, and `/exports` folders have write permissions (`755` or `775`).

---
> [!IMPORTANT]
> **Persistent Storage**: Unlike Vercel, Hostinger Cloud Startup has a persistent filesystem. Your `ecogreen.db` and uploaded templates will stay safe across restarts/deployments as long as you don't delete them in the File Manager.
