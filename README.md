# Cross-Site-Scripting-Demo-Project
Demo-Projekt zum Thema Cross Site Scripting.

## Voraussetzungen
- Docker muss eingerichtet sein
- Git, um das Repository zu klonen

## Start
```bash
git clone <URL-DES-REPOSITORY>
cd Cross-Site-Scripting-Demo-Project
docker compose up --build
```
Danach im Browser öffnen: http://127.0.0.1:8080

Zum Beenden:
```bash
docker compose down
```
Die Kommentare bleiben in einem Docker-Volume erhalten. Zum vollständigen Zurücksetzen inklusive gespeicherter Kommentare:
```bash
docker compose down -v
```
