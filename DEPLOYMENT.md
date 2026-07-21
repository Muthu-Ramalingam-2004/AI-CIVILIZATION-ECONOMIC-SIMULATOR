# Deployment Guide for AI Civilization Economic Simulator Backend

This guide outlines the deployment settings and steps for running the FastAPI backend on both **Render** and **Railway**.

---

## 1. Render Deployment (Native Python Runtime)

Deploying as a Native Python Web Service is the recommended free-tier option on Render.

### Parameters
* **Platform:** Render
* **Runtime:** `Python`
* **Root Directory:** `backend`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Python Version:** `3.12.10` (Configured via `backend/.python-version` and the `PYTHON_VERSION` environment variable)

### Environment Variables
Set the following environment variables in the Render Service Settings or via `render.yaml`:

| Key | Value / Source | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.12.10` | Enforces the use of Python 3.12 |
| `DATABASE_URL` | From Database Connection String | PostgreSQL connection string (falls back to local SQLite if unreachable) |
| `SECRET_KEY` | (Generated automatically) | Secret key for JWT session tokens |
| `ALGORITHM` | `HS256` | JWT cryptographic signing algorithm |
| `FRONTEND_URL` | `https://ai-civilization-economic-simulator.vercel.app` | URL of the frontend for CORS settings |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP Server Host for reset emails |
| `SMTP_PORT` | `587` | SMTP Server Port |
| `SMTP_USERNAME` | *(Your Gmail/Email)* | Username for email sender authentication |
| `SMTP_PASSWORD` | *(Your App Password)* | App Password for email sender authentication |
| `SMTP_FROM_EMAIL` | *(Your email address)* | Sender email address |

### Deployment Steps
1. Connect your GitHub repository to Render.
2. Select **New > Web Service**.
3. Choose the repository and select **Python** as the runtime (or use the Blueprint configuration with `render.yaml`).
4. Set the **Root Directory** to `backend`.
5. Enter the Build Command: `pip install -r requirements.txt`
6. Enter the Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. In the **Environment Variables** section, add the variables listed above (especially `PYTHON_VERSION` and `DATABASE_URL`).
8. Click **Deploy Web Service**.

---

## 2. Railway Deployment (Docker Container Runtime)

Deploying using the Dockerfile is the default and recommended method on Railway.

### Parameters
* **Platform:** Railway
* **Runtime:** `Docker` (built automatically using `backend/Dockerfile`)
* **Root Directory:** `/backend` (or root with subdirectory setting pointing to `backend`)
* **Build Command:** Built via Dockerfile (`docker build`)
* **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (Specified in Dockerfile `CMD`)

### Environment Variables
Set these variables in your Railway Service settings under the **Variables** tab:

| Key | Value / Source | Description |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` or connection string | PostgreSQL connection URL (falls back to SQLite if unreachable) |
| `SECRET_KEY` | *(Your Secret Key)* | Secret key for JWT |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `FRONTEND_URL` | `https://ai-civilization-economic-simulator.vercel.app` | Frontend origin for CORS |
| `PORT` | `10000` (or dynamic) | Port assigned by Railway (uvicorn binds dynamically) |

### Deployment Steps
1. Create a new project on Railway and click **Deploy from GitHub repo**.
2. Select your repository.
3. In the service settings, set the **Root Directory** to `/backend`. Railway will automatically locate the `Dockerfile` inside `/backend` and deploy it.
4. Go to the **Variables** tab and configure your environment variables.
5. Railway will trigger the build automatically using the `backend/Dockerfile` and start the server using the exposed port.
6. Once deployed, click **Generate Domain** in the settings tab to expose a public endpoint.
