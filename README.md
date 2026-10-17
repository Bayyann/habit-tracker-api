# Habit Tracker API

## Run the backend

From the repository root, activate the existing virtual environment and start FastAPI:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

## Run the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). During development, Vite proxies `/api` requests to `http://127.0.0.1:8000`, so the frontend and API can run without changing backend CORS settings. To point the proxy at a different local API host, copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_PROXY_TARGET`. `VITE_API_BASE_URL` can be set to an absolute API base URL when serving the frontend outside the Vite development proxy; that deployment must configure CORS on the API for the frontend origin.

## SQLAdmin access

SQLAdmin is available at `http://localhost:5173/admin` during Vite development (or directly at `http://127.0.0.1:8000/admin`). It uses a separate session-based login with the username and password of an account explicitly marked as an administrator. Admin access is not granted during public registration.

To create a separate administrator login (recommended, so it does not depend on Jeje's forgotten password), from the repository root run:

```powershell
.\.venv\Scripts\python.exe -m app.admin_cli --create-admin siteadmin
```

The command prompts for a password without echoing it; choose a strong password and keep it private. To grant access to a different existing account, use `.venv\Scripts\python.exe -m app.admin_cli YOUR_USERNAME`. To revoke access, use `.venv\Scripts\python.exe -m app.admin_cli --revoke YOUR_USERNAME`. Keep `SESSION_SECRET_KEY` private and set it to a long random value outside development; SQLAdmin uses it to sign secure sessions. User, habit, and check-in records are read-only through SQLAdmin. The user list does not expose password hashes.
