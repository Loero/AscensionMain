# Ascension Admin WPF

Egyszeru asztali admin kliens az Ascension backendhez.

## Funkciok

- Admin login (`/api/admin/login`)
- Dashboard statisztikak (`/api/admin/overview`)
- Felhasznalo lista (`/api/admin/users`)
- Felhasznalo torles (`/api/admin/users/:id`)

## Backend admin belepes

A backendben az admin belepes alapbol:

- username: `admin`
- password: `admin123`

Ezeket a backend inditasnal felul tudod irni:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

Pelda PowerShell-ben:

```powershell
cd ..\Ascension-Backend
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "eros_jelszo"
npm start
```

## Futtatas

```powershell
cd .\Ascension-Admin-WPF
dotnet restore
dotnet run
```

A kliensben add meg a backend URL-t, altalaban:

- `http://localhost:3000`
