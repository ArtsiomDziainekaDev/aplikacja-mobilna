# Połączenie aplikacji mobilnej z backendem

## Najprostszy sposób: emulator Android na komputerze

Nie trzeba otwierać portu w firewallze ani łączyć telefonu przez Wi‑Fi — emulator działa na tym samym PC co backend.

### 1. Zainstaluj Android Studio i emulator

- Pobierz [Android Studio](https://developer.android.com/studio).
- Zainstaluj, uruchom i przejdź: **More Actions → Virtual Device Manager** (albo **Tools → Device Manager**).
- Utwórz urządzenie (np. **Pixel 6**) z systemem **API 34** lub nowszym i uruchom emulator.

### 2. Ustaw adres API dla emulatora

W pliku `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8081
```

`10.0.2.2` w emulatorze Android oznacza localhost twojego komputera.

### 3. Uruchom backend i aplikację

W jednym terminalu (katalog projektu):

```bash
docker compose up
```

W drugim:

```bash
cd mobile
npx expo start --port 8082
```

Gdy Expo się uruchomi, naciśnij **a** (Android) — aplikacja otworzy się w emulatorze i połączy z backendem.

Po zmianie `.env` uruchom ponownie: `npx expo start --port 8082 -c`.

---

## Telefon/tablet w Wi‑Fi (iPhone lub Android)

Jeśli chcesz testować na fizycznym urządzeniu w tej samej sieci co komputer.

### Krok 1: Otwórz port 8081 w Windows

**PowerShell uruchom jako Administrator**:

```powershell
cd c:\programming\JavaSRC\ProjectAPI1.1
.\scripts\allow-port-8081-firewall.ps1
```

Albo ręcznie: Panel sterowania → Zapora systemu Windows → Zaawansowane ustawienia → Reguły ruchu przychodzącego → Nowa reguła → Port → TCP 8081 → Zezwól.

### Krok 2: Sprawdź backend z komputera

```powershell
curl http://192.168.1.28:8081/api/health
```

(Zamień `192.168.1.28` na swój IPv4 z `ipconfig` — sekcja „Adapter sieci bezprzewodowej Wi‑Fi”.)

Jeśli dostaniesz JSON — backend jest dostępny. Jeśli nie — uruchom skrypt z Kroku 1 i ponownie `docker compose up`.

### Krok 3: Telefon w tej samej Wi‑Fi

Urządzenie i komputer muszą być w **tej samej sieci Wi‑Fi**.

### Krok 4: Plik mobile/.env

W `mobile/.env` ustaw IP komputera:

```
EXPO_PUBLIC_API_URL=http://192.168.1.28:8081
```

Po każdej zmianie `.env`:

```bash
cd mobile
npx expo start --port 8082 -c
```

I ponownie otwórz aplikację na telefonie (skanuj QR z Expo).

### Krok 5: Test w przeglądarce na telefonie

W Safari (iPhone) lub Chrome (Android) wpisz: `http://192.168.1.28:8081/api/health`. Jeśli widzisz JSON — sieć i firewall są OK.
