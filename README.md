# EchoVro – Full‑stack Demo

link:https://echovrolive.vercel.app/

This repository contains the **EchoVro** demo application that connects a modern **React‑style frontend**, backend with **Java** using Spring Boot and a persistent **PostgresSQL** database.

---

## Quick Start (Windows)

1. **Prerequisites**
   - **Java 21** (or newer) with `java` on your `PATH`.
   - **Maven** (`mvn`) on the `PATH`.
   - **PowerShell** (default on Windows).

2. **Project location**
   ```text
   C:\Users\lisna\.gemini\antigravity\scratch\echovro
   ```

3. **Build the backend**
   ```powershell
   cd C:\Users\lisna\.gemini\antigravity\scratch\echovro\backend\echovro
   mvn clean package -DskipTests
   ```
   This creates `target\echovro-0.0.1-SNAPSHOT.jar`.

4. **Start the server**
   Run the convenience script supplied in the project root:
   ```powershell
   ./start.ps1
   ```
   The script launches the JAR and opens the default browser at `http://localhost:8080`.
   > **Note:** The process runs as a background daemon. Close the PowerShell window or stop the `java` process to shut it down.

5. **Explore the app**
   - **Register** a new user via the UI (or the API shown below).
   - **Login** to obtain a JWT token – the UI stores it automatically.
   - Browse places, request connections, send chats, and watch real‑time sync via polling.

---

## API Quick Test (PowerShell)
```powershell
# Register a new user
$regBody = '{"name":"alice","email":"alice@example.com","password":"Secret123"}'
$reg = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody
Write-Host "Registered: $($reg.name)"

# Login
$loginBody = '{"email":"alice@example.com","password":"Secret123"}'
$login = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$jwt = $login.token
Write-Host "JWT: $($jwt.Substring(0,20))..."

# Get my profile (requires JWT)
$profile = Invoke-RestMethod -Headers @{Authorization = "Bearer $jwt"} -Uri "http://localhost:8080/api/me" -Method GET
Write-Host "Profile name: $($profile.name)"

# Fetch feed for the "city" place
$feed = Invoke-RestMethod -Headers @{Authorization = "Bearer $jwt"} -Uri "http://localhost:8080/api/places/city/feed?user=alice" -Method GET
Write-Host "Place feed: $($feed.people.Count) people, $($feed.songs.Count) songs"
```

---

## Project Structure
```
├─ backend
│  └─ echovro
│     ├─ src/main/java/com/echovro/echovro
│     │   ├─ model        # JPA entities (User, Connection, ChatMessage, SyncEvent)
│     │   ├─ repository   # Spring Data repositories
│     │   ├─ dto          # Data‑transfer objects for the REST API
│     │   ├─ service      # Business logic (UserService, PlaceService, …)
│     │   └─ controller   # REST endpoints
│     ├─ src/main/resources/static   # Front‑end static files (index.html, assets)
│     └─ pom.xml
└─ index.html   # Top‑level copy for easy editing
```

---

## Stopping the Server
If you started the server with `start.ps1`, close the PowerShell window. If you launched it manually, locate the Java process (e.g., `Get-Process java`) and stop it:
```powershell
Stop-Process -Id <PID>
```

---

## Future Ideas
- Replace polling‑based sync with WebSocket for true real‑time.
- Connect real Spotify/YouTube OAuth flows (currently DEMO_MODE).
- Add unit and integration tests.
- Containerise with Docker or deploy to a cloud VM.

---

Enjoy exploring **EchoVro**! If anything is unclear or you hit an issue, just let me know.
