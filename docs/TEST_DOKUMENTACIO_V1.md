# TESZTDOKUMENTACIO V1

## 1. Dokumentum celja

Ez a dokumentum az AscensionMain projekt jelenleg elkeszult funkcioinak tesztelesi tervet es vegrehajtasi modjat tartalmazza.
A dokumentum a beadashoz es a fejlesztoi ellenorzeshez is hasznalhato.

## 2. Projekt adatok

- Projekt neve: AscensionMain
- Datum: 2026-04-05
- Verzioszint: V1
- Teszteles tipusa: manualis funkcionlis teszteles + API ellenorzes

## 3. Tesztelesi hatokor

### 3.1 In scope (teszteljuk)

- Felhasznaloi autentikacio
  - Regisztracio
  - Bejelentkezes
  - Tokenes vedett endpointok
- Profil
  - Profil statisztikak lekerese
  - Profil reszletek mentese
  - Profil reszletek torlese
- Etel naplo
  - Uj etel bejegyzes
  - Etel bejegyzesek listazasa
  - Etel bejegyzes torlese
- Edzes naplo
  - Uj edzes bejegyzes
  - Edzes lista
  - Egyedi es osszes edzes torles
- Skin rutin
  - Rutin mentes/frissites
  - Aktiv rutin lekeres
  - Napi tracking mentes
  - Napi tracking lekeres
- Admin API
  - Admin login
  - Dashboard overview
  - Felhasznalo lista
  - Felhasznalo torles

### 3.2 Out of scope (jelen V1-ben nem teszteljuk)

- Arc oldal (Frontend)
- Mental oldal (Frontend)

Megjegyzes: ezek a modulok fejlesztes alatt vannak, kulon V1.1 kiegeszitesben kerulnek be a tesztdokumentacioba.

## 4. Teszt kornyezet

- OS: Windows
- Backend: Node.js + Express + Sequelize + MySQL
- Frontend: React (Vite)
- Admin kliens: WPF (.NET 7)
- API teszteles: Swagger UI vagy Postman

### 4.1 Inditasi lepesei

1. Database import phpMyAdmin-ban a database.sql alapjan.
2. Backend inditas: Ascension-Backend mappa, npm install, npm start.
3. Frontend inditas: Ascension-Frontend-React mappa, bun install, bun dev.
4. Opcionais admin: Ascension-Admin-WPF mappa, dotnet restore, dotnet run.

### 4.2 Tesztek futtatasa lepesrol lepesre (Swagger alapu mod)

Ez a resz a gyakorlati vegrehajtast mutatja be, hogy hogyan futtasd le a 6. fejezet teszteseteit.

1. Nyisd meg a Swagger feluletet: http://localhost:3000/swagger
2. Eloszor futtasd az AUTH-01 es AUTH-03 tesztet, hogy legyen user es token.
3. AUTH-03 valaszabol masold ki a token erteket.
4. A Swagger jobb felso sarkaban kattints az Authorize gombra.
5. Add meg igy a tokent: Bearer SAJAT_TOKEN
6. Innentol futtasd a vedett endpointokat a kovetkezo sorrendben:
   - PROF-01, PROF-02, PROF-03
   - FOOD-01, FOOD-03, FOOD-04, FOOD-05, FOOD-02
   - WORK-01, WORK-03, WORK-04, WORK-05, WORK-02
   - SKIN-01, SKIN-03, SKIN-04, SKIN-05, SKIN-02
7. Kulon admin tokenhez futtasd az ADM-01 tesztet.
8. ADM-01 tokennel ujra Authorize, majd futtasd:
   - ADM-03, ADM-04, ADM-05, ADM-02

### 4.3 Mit irj be egy tesztrol, hogy PASS vagy FAIL

- PASS, ha a valasz HTTP status es a response body megegyezik az elvart eredmennyel.
- FAIL, ha eltero status kod vagy hibas valasz jon.
- BLOCKED, ha kornyezeti ok miatt nem futtathato (pl. adatbazis hiba, szerver nem indul).

Rogzites minimum:

- Teszteset ID
- Datum
- Tesztelo neve
- Eredmeny (PASS/FAIL/BLOCKED)
- Megjegyzes (pl. kapott status kod, hiba uzenet)

### 4.4 Mintafuttatas ket tesztesetre

Pelda 1: AUTH-01

- Endpoint: POST /api/auth/register
- Body minta:
  {
  "username": "teszt_user_01",
  "email": "teszt_user_01@mail.com",
  "password": "123456"
  }
- Elvart: success=true, user objektum letrejon

Pelda 2: AUTH-03

- Endpoint: POST /api/auth/login
- Body minta:
  {
  "emailOrUsername": "teszt_user_01",
  "password": "123456"
  }
- Elvart: success=true, token visszajon
- Teendo: token masolasa es Authorize beallitasa

### 4.5 Frontend smoke ellenorzes (manualis)

1. Nyisd meg: http://localhost:5173
2. Ellenorizd, hogy a fooldal betolt hiba nelkul.
3. Hajts vegre egy alap user flow-t:
   - Regisztracio vagy login
   - Profil adatok mentese
   - Etel bejegyzes hozzaadasa
   - Edzes bejegyzes hozzaadasa
4. Ellenorizd, hogy a kliens oldalon megjelennek a mentett adatok.

Megjegyzes: Arc es Mental oldal tovabbra is V1.1-ben tesztelendo.

## 5. Belepesi es kilepesi kriteriumok

### 5.1 Belepesi kriteriumok

- A backend szerver fut.
- Az adatbazis kapcsolodik.
- A frontend elerheto (localhost:5173).
- Van teszt felhasznalo vagy letrehozhato.

### 5.2 Kilepesi kriteriumok

- Az in scope funkcioknal minden kritikus teszteset PASS.
- Nincs blocker vagy kritikus hiba nyitva.
- Minden ismert hiba rogzitve van a megjegyzesekben.

## 6. Tesztesetek

Jelolesek:

- Prioritas: H (high), M (medium), L (low)
- Eredmeny: PASS/FAIL/BLOCKED

| ID      | Modul   | Teszteset leirasa                      | Elovetel               | Lepesek                               | Elvart eredmeny                              | Prioritas |
| ------- | ------- | -------------------------------------- | ---------------------- | ------------------------------------- | -------------------------------------------- | --------- |
| AUTH-01 | Auth    | Regisztracio ervenyes adatokkal        | Nincs ilyen user       | POST /api/auth/register               | success=true, user letrejon                  | H         |
| AUTH-02 | Auth    | Regisztracio duplikalt emaillel        | Mar letezo email       | Ujra register ugyanazzal az emaillel  | 409 hiba                                     | H         |
| AUTH-03 | Auth    | Login helyes adatokkal                 | Letezo user            | POST /api/auth/login                  | success=true, token visszajon                | H         |
| AUTH-04 | Auth    | Login hibas jelszoval                  | Letezo user            | Hibas jelszo kuldese                  | 401 hiba                                     | H         |
| AUTH-05 | Auth    | Vedett endpoint token nelkul           | Nincs token            | GET /api/profile token nelkul         | 401 hiba                                     | H         |
| PROF-01 | Profile | Profil statisztikak lekerese           | Van ervenyes token     | GET /api/profile                      | success=true, food/workout objektumok jonnek | H         |
| PROF-02 | Profile | Profil reszletek mentese               | Van token              | POST /api/profile/details valid body  | success=true                                 | H         |
| PROF-03 | Profile | Profil reszletek torlese               | Letezo profil reszlet  | DELETE /api/profile/details           | success=true, deletedRows >= 0               | M         |
| FOOD-01 | Food    | Etel bejegyzes mentese                 | Van token              | POST /api/food/add valid body         | success=true, entryId                        | H         |
| FOOD-02 | Food    | Etel bejegyzes hianyzo mezovel         | Van token              | POST /api/food/add hianyos body       | 400 hiba                                     | H         |
| FOOD-03 | Food    | Etel lista datum szurovel              | Van adat               | GET /api/food/entries?date=YYYY-MM-DD | success=true, lista megfelelo                | M         |
| FOOD-04 | Food    | Etel torles sajat ID-vel               | Van sajat rekord       | DELETE /api/food/:id                  | success=true                                 | H         |
| FOOD-05 | Food    | Etel torles nem letezo ID-vel          | Nincs ilyen rekord     | DELETE /api/food/:id                  | 404 hiba                                     | M         |
| WORK-01 | Workout | Edzes mentese helyes adatokkal         | Van token              | POST /api/workout                     | success=true, entryId                        | H         |
| WORK-02 | Workout | Edzes mentese hianyzo kotelezo mezovel | Van token              | POST /api/workout hianyos body        | 400 hiba                                     | H         |
| WORK-03 | Workout | Edzes lista lekerese                   | Van adat               | GET /api/workout                      | success=true, entries tomb                   | M         |
| WORK-04 | Workout | Edzes torles ID alapjan                | Van sajat rekord       | DELETE /api/workout/:id               | success=true                                 | H         |
| WORK-05 | Workout | Osszes edzes torles                    | Van tobb rekord        | DELETE /api/workout                   | success=true, deletedCount                   | M         |
| SKIN-01 | Skin    | Rutin elso mentese                     | Van token              | POST /api/skin/save-routine           | success=true, inserted=true                  | H         |
| SKIN-02 | Skin    | Rutin ujramentes valtozas nelkul       | Van aktiv rutin        | Ujra kuldes ugyanazzal a bodyval      | success=true, unchanged=true                 | M         |
| SKIN-03 | Skin    | Aktiv rutin lekerese                   | Van aktiv rutin        | GET /api/skin/routine                 | success=true, routine objektum               | H         |
| SKIN-04 | Skin    | Tracking mentese                       | Van routine_id         | POST /api/skin/tracking               | success=true                                 | H         |
| SKIN-05 | Skin    | Tracking lekerese                      | Van tracking adat      | GET /api/skin/tracking?routine_id=... | success=true, tracking objektum              | M         |
| ADM-01  | Admin   | Admin login helyes adatokkal           | Ismert admin user/pass | POST /api/admin/login                 | success=true, token                          | H         |
| ADM-02  | Admin   | Admin login hibas adatokkal            | -                      | POST /api/admin/login hibas body      | 401 hiba                                     | H         |
| ADM-03  | Admin   | Overview lekeres                       | Van admin token        | GET /api/admin/overview               | success=true, osszesitett adatok             | H         |
| ADM-04  | Admin   | User lista lekeres                     | Van admin token        | GET /api/admin/users                  | success=true, users tomb                     | M         |
| ADM-05  | Admin   | User torles ervenyes ID-vel            | Van admin token        | DELETE /api/admin/users/:id           | success=true                                 | H         |

## 7. NFR (nem funkcionalis) ellenorzesek

- Valaszido alap ellenorzes: normal terheles mellett API valaszido elfogadhato (kb. 1-2 mp alatt).
- Alap biztonsagi ellenorzes:
  - Token nelkuli vedett endpointok 401-et adnak.
  - Ervenytelen admin token 403-at ad.
- Input validacio ellenorzes:
  - Kotelezo mezok hianya 400-as hibat adjon.

## 8. Hiba rogzitese

Hibakat minimum az alabbi adatokkal rogzitsuk:

- Hiba azonosito
- Modul
- Lepesek a reprodukalashoz
- Elvart eredmeny
- Tenyleges eredmeny
- Sulyossag (Critical/High/Medium/Low)
- Statusz (Open/In Progress/Fixed/Retest)

## 9. Teszt jegyzokonyv sablon (futtatashoz)

| ID      | Datum      | Tesztelo | Eredmeny  | Megjegyzes |
| ------- | ---------- | -------- | --------- | ---------- |
| AUTH-01 | 2026-**-** |          | PASS/FAIL |            |
| AUTH-02 | 2026-**-** |          | PASS/FAIL |            |
| ...     | ...        | ...      | ...       | ...        |

## 10. Arc es Mental bovitmeny terv (V1.1)

Amint az Arc es Mental oldalak fejlesztese lezarul:

- Uj tesztmodulok: ARC-xx, MENTAL-xx
- UI tesztek:
  - oldal betoltes
  - form validacio
  - API integracio
  - hibakezeles
- Dokumentum frissites: jelen fajl V1.1 verziora emelve

## 11. Jovahagyas

- Keszitette: Rajna Torda, Csillik Gergely, Müller Zsolt
- Ellenorizte: ********\_\_\_\_********
- Jovahagyta: ********\_\_\_\_********
- Jovahagyas datuma: ******\_\_******
