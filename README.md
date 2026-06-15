# ProjectAPI1.1 — Platforma wymiany kryptowalut i walut

## Temat projektu

Webowa i mobilna aplikacja do wymiany kryptowalut i walut tradycyjnych z interfejsem użytkownika i dostępem do bazy danych PostgreSQL. Umożliwia przeglądanie kursów, składanie zamówień i zarządzanie kontem. Panel administracyjny służy do zarządzania zamówieniami i użytkownikami.

## Autorzy

- **Artsiom Dziaineka** — 68088  
- **Volodymyr Hryhoriak** — 55651 

## Architektura

- **Backend** — Spring Boot 3.2.0 (Java 21), REST API  
- **Frontend (web)** — React 18, TypeScript, Material-UI, Vite  
- **Aplikacja mobilna** — React Native (Expo), Expo Router, Redux Toolkit  
- **Baza danych** — PostgreSQL 16  

## Funkcjonalności

- **Użytkownicy:** rejestracja (`POST /api/auth/signup`), logowanie (`POST /api/auth/signin`), status (`GET /api/auth/check`), role USER/ADMIN, hasła BCrypt  
- **Zamówienia:** tworzenie (`POST /api/orders`), moje zamówienia (`GET /api/orders/my`), lista dla admina (`GET /api/orders`), zmiana statusu (`PUT /api/orders/{id}/status`)  
- **Kryptowaluty:** lista (`GET /api/crypto`), cena (`GET /api/crypto/{symbol}/price`), CoinMarketCap, BTC, ETH, BNB, ADA, SOL, DOT, LINK, LTC  
- **Waluty:** lista i kursy (`GET /api/currencies`, CurrencyFreaks), USD, EUR, GBP względem PLN  
- **Admin:** `GET /api/admin/test`, `GET /api/admin/orders`  

## Wymagania

- Docker 20.10+, Docker Compose 2.0+  
- Dla mobilnej: Node.js 18+, dla emulatora Android — Android Studio / Android SDK  

## Uruchomienie

### Backend i frontend web (Docker)

```bash
docker compose up
```

- **Frontend:** http://localhost  
- **Backend API:** http://localhost:8081  
- **Baza:** localhost:5432  

### Aplikacja mobilna (Expo)

1. Uruchom backend: w katalogu głównym `docker compose up`.  
2. W katalogu projektu:

   ```bash
   cd mobile
   npm install
   ```

3. Ustaw adres API w `mobile/.env`, kopiując `mobile/.env.example`:
   - **Przeglądarka (web):** `EXPO_PUBLIC_API_URL=http://localhost:8081`
   - **Emulator Android:** `EXPO_PUBLIC_API_URL=http://10.0.2.2:8081`
   - **Urządzenie w sieci:** `EXPO_PUBLIC_API_URL=http://IP_KOMPUTERA:8081`

4. Uruchom Expo dla aplikacji mobilnej na osobnym porcie, aby nie konfliktował z backendem:

   ```bash
   npx expo start --port 8082 -c
   ```

5. **Wersja mobilna (nie web):**
   - **Android:** w terminalu naciśnij **a** (otwiera emulator, jeśli jest Android SDK i ANDROID_HOME) lub zeskanuj QR kod aplikacją **Expo Go** na telefonie.  
   - **iOS:** zeskanuj QR w aplikacji **Expo Go** na urządzeniu.  

Jeśli przy **a** pojawi się błąd „Android SDK path” / „adb”: zainstaluj Android Studio, skonfiguruj emulator i ustaw zmienną `ANDROID_HOME` (np. `C:\\Users\\TwojaNazwa\\AppData\\Local\\Android\\Sdk`).  

### Budowanie APK (EAS Build)

```bash
cd mobile
npm i -g eas-cli
eas login
eas build --platform android --profile preview
```

APK pobierzesz z panelu Expo. Własna ikona/splash: pliki w `mobile/assets/` (np. `icon.png` 1024×1024) — [dokumentacja Expo](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).

## Struktura projektu

```
ProjectAPI1.1/
├── backend/          # Spring Boot, REST API, Flyway
├── frontend/         # React (web), Vite, Redux
├── mobile/           # Expo (React Native)
│   ├── app/          # Expo Router: (auth), (tabs)
│   ├── src/          # store, api, theme, components, __tests__
│   ├── assets/       # ikona, splash
│   ├── app.json, eas.json
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Konfiguracja

### Zmienne środowiskowe (backend — docker-compose / application)

- `SPRING_DATASOURCE_*`, `JWT_SECRET`, `JWT_EXPIRATION`  
- `CURRENCYFREAKS_APIKEY`, `COINMARKETCAP_API_KEY`, `CRYPTO_SELL_DISCOUNT_PERCENT`  

### Porty

- Frontend (nginx): 80  
- Backend: 8081  
- Expo / Metro dla aplikacji mobilnej: 8082
- PostgreSQL: 5432  

## Testowanie API (curl)

```bash
# Rejestracja
curl -X POST http://localhost:8081/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"test\",\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Logowanie
curl -X POST http://localhost:8081/api/auth/signin -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Kryptowaluty (z tokenem)
curl -X GET http://localhost:8081/api/crypto -H "Authorization: Bearer <token>"
```

## Rozwiązywanie problemów

- **Kontenery nie startują:** sprawdź porty 80, 8081, 5432; `docker compose down && docker compose up`.  
- **Backend nie łączy się z DB:** `docker compose logs postgres` — kontener musi być „healthy”.  
- **Frontend nie łączy z backendem:** sprawdź `frontend/nginx.conf` i logi `docker compose logs frontend`.  
- **Aplikacja mobilna — „Brak połączenia z serwerem”:** backend musi działać; dla emulatora Android ustaw w `mobile/.env`: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8081`. Dla iPhone/telefonu w Wi‑Fi ustaw `EXPO_PUBLIC_API_URL=http://IP_KOMPUTERA:8081`. Expo uruchamiaj na osobnym porcie: `npx expo start --port 8082 -c`.  
- **„Android SDK path” / „adb”:** zainstaluj Android Studio, ustaw `ANDROID_HOME` na katalog SDK.  
- **403 w Expo Go na telefonie:** sprawdź, czy Expo nie koliduje z backendem na tym samym porcie. Backend zostaje na `8081`, a Expo uruchamiaj na `8082` (`npx expo start --port 8082 -c`).  
- **UX w aplikacji mobilnej:** wprowadzono haptic feedback oraz lekkie animacje fade-in / press-scale na kluczowych ekranach, aby poprawić responsywność i komfort użycia.

## Technologie

- **Backend:** Spring Boot, Security (JWT), Data JPA, PostgreSQL, Flyway, Lombok  
- **Frontend:** React, TypeScript, MUI, Redux Toolkit, React Router, Axios, Vite  
- **Mobile:** Expo, Expo Router, Redux Toolkit, React Native Paper, SecureStore (native) / AsyncStorage (web), expo-location, NetInfo, Jest, expo-haptics, Animated  
- **Infrastruktura:** Docker, PostgreSQL, Nginx, Gradle, npm  


### Wymagania wstępne


| Nr | Kryterium | Status |
|----|-----------|--------|
| 1 | **Architektura** — Redux Toolkit, podział na slice’y (auth, crypto, orders), komponenty + ekrany | Zrealizowane |
| 2 | **Rozmiary i orientacja** — Flexbox, `useWindowDimensions`, `Dimensions.get`, pliki `theme/colors.ts`, `theme/spacing.ts` | Zrealizowane |
| 3 | **Jakość kodu** — ESLint, Prettier, TypeScript (konfiguracja w `mobile/`) | Zrealizowane |
| 4 | **Testy** — Jest, React Native Testing Library, 10+ testów (slice’y, ErrorBoundary, theme, cache, store) | Zrealizowane |
| 5 | **Dokumentacja** — README z uruchomieniem, technologiami, strukturą; komentarze „dlaczego” w kluczowych miejscach (np. `api/client.ts`, `ErrorBoundary`) | Zrealizowane; opcjonalnie: screenshoty/GIF w README |
| 6 | **Funkcje natywne (min. 2)** — (1) Expo SecureStore — token JWT na urządzeniu; (2) Expo Location — geolokalizacja z obsługą uprawnień i odmowy | Zrealizowane |
| 7 | **Operacje asynchroniczne** — `createAsyncThunk`, stany loading/error, RefreshControl, sprawdzanie sieci (NetInfo) przed żądaniami | Zrealizowane |
| 8 | **Nawigacja** — Expo Router: stack (auth: login, register) + tabs (Start, Kryptowaluty, Zamówienia) | Zrealizowane |
| 9 | **Wydajność** — FlatList dla list, `useCallback`/`keyExtractor` przy listach | Zrealizowane |
| 10 | **Styl i UI/UX** — React Native Paper (theme), spójne kolory i odstępy w `src/theme/` | Zrealizowane |
| 11 | **Stan aplikacji** — Redux Toolkit (globalny), `useState` (lokalny, np. formularze) | Zrealizowane |
| 12 | **Obsługa błędów** — Error Boundary, NetInfo (`useConnectivity`), komunikaty błędów, przycisk „Spróbuj ponownie” | Zrealizowane |
| 13 | **Tryb offline** — AsyncStorage: cache listy kryptowalut i zamówień; przy braku sieci wyświetlane dane z cache | Zrealizowane |
| 14 | **Bezpieczeństwo** — token w SecureStore (na web fallback: AsyncStorage), `EXPO_PUBLIC_API_URL` w zmiennych env, brak kluczy API w kodzie | Zrealizowane; w produkcji API po HTTPS |
| 15 | **Deployment** — EAS Build, `app.json`, `eas.json`, opis budowania w README | Zrealizowane; **do dopracowania:** własna ikona (obecnie placeholder) — dodać pliki w `mobile/assets/` i przebudować |

### Kryteria bazowe — oczekuje dopracowania

| Co | Uwagi |
|----|--------|
| Repozytorium Git | Opublikować na GitHub/GitLab i utrzymywać sensowną historię commitów. |
| Własna ikona aplikacji (kryt. 15) | Zamienić placeholder w `mobile/assets/` na własne `icon.png`, `splash-icon.png`, `adaptive-icon.png` (np. 1024×1024) i wykonać ponownie EAS Build. |
| Screenshoty/GIF w README (kryt. 5) | Opcjonalnie dodać zrzuty ekranu z aplikacji mobilnej do README. |

### Kryteria rozszerzone (na ocenę 5.0–6.0)

| Kryterium | Status |
|-----------|--------|
| **A. Backend i baza danych** | Zrealizowane — aplikacja łączy się z własnym backendem (Spring Boot + PostgreSQL), dane trwałe po reinstalacji, CRUD ze stanami loading/error. |
| **B. Autoryzacja** | Częściowo — rejestracja i logowanie (email + hasło), token w SecureStore, ekrany chronione, auto-login po restarcie. **Do dopracowania:** druga metoda logowania (np. Google lub Apple). |
| **C. Integracja z zewnętrznym API** | Zrealizowane — backend korzysta z CoinMarketCap i CurrencyFreaks; aplikacja mobilna korzysta z tego API przez backend; loading/error obsłużone; klucze API w zmiennych środowiskowych po stronie backendu. |
| **D. Zaawansowany UX** (min. 2 z: animacje, gesty, offline sync, haptic feedback) | **Zrealizowane w dużej części** — dodano haptic feedback, fade-in/press-scale animacje na kluczowych ekranach i subtelne animacje interakcji. Do ewentualnego rozwinięcia: dodatkowe gesty lub bardziej rozbudowane animacje. |

---

## Changelog (ostatnie zmiany)

- 2026-06-15: Aplikacja mobilna zapisuje avatar profilu lokalnie przez `expo-file-system`.

## Licencja

Projekt edukacyjny.  
