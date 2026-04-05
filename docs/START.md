# ⚡ GYORS START

## 1. phpMyAdmin (http://localhost/phpmyadmin)

SQL fül → Másold be a `database.sql` tartalmát → Végrehajtás

## 2. Backend indítása

```bash
cd c:\Users\Torda1\Desktop\vizsga_jo\AscensionMain\Ascension-Backend
npm install
npm start
```

## 3. Frontend indítása

```bash
cd c:\Users\Torda1\Desktop\vizsga_jo\AscensionMain\Ascension-Frontend-React
bun install
bun dev
```

## 3. Böngésző

Nyisd meg az `http://localhost:5173`-t

---

**Működik?** Regisztrálj és jelentkezz be! 🎉

**Nem működik?** Nézd meg a `TELEPITES.md` fájlt!

## 4. WPF Admin felulet (opcionalis)

```bash
cd c:\Users\Torda1\Desktop\vizsga_jo\AscensionMain\Ascension-Admin-WPF
dotnet restore
dotnet run
```

Alap admin login adatok a backendben:

- username: `admin`
- password: `admin123`

Ezeket valtozokkal felul tudod irni backend inditas elott:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

Az `Ascension-Backend/server.js` a fo backend. A root `server.js` mar nem szukseges a futtatasahoz.
