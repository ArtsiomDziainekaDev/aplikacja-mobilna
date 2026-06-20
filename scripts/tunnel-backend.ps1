# Tunel HTTP do backendu (port 8081) — działa z iPhone hotspot, gdy 172.20.10.x nie łączy.
# Wymaga: docker compose up (backend na localhost:8081).
#
# Użycie:
#   1. Uruchom ten skrypt (zostaw okno otwarte).
#   2. Skopiuj URL (https://....loca.lt) do mobile/.env:
#        EXPO_PUBLIC_API_URL=https://....loca.lt
#   3. npx expo start --tunnel --port 8083 -c

Write-Host "Uruchamiam tunel do http://localhost:8081 ..." -ForegroundColor Cyan
Write-Host "Po pojawieniu sie URL wklej go do mobile/.env jako EXPO_PUBLIC_API_URL" -ForegroundColor Yellow
Write-Host "Nastepnie: cd mobile; npx expo start --tunnel --port 8083 -c" -ForegroundColor Yellow
Write-Host ""

npx --yes localtunnel --port 8081
