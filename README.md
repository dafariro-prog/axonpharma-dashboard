# Dashboard Maruchan · Meta Awareness

Dashboard web automatizado de las campañas de **Meta** de la cuenta `MARUCHAN_Porter_BMCR`
(`1192531552979145`). Solo data real de Meta vía Windsor.ai. Se actualiza solo cada día.

## Arquitectura

- `index.html` — dashboard estático; lee `data/dashboard.json` y calcula todo en el navegador.
- `data/dashboard.json` — snapshot de datos reales (lo regenera el refresco diario).
- `refresh.js` — jala data de Meta desde la API REST de Windsor.ai y reescribe el JSON.
- `.github/workflows/refresh.yml` — GitHub Action que corre `refresh.js` cada día (05:00 CR) y commitea el JSON. Vercel redeploya solo al detectar el push.

## Puesta en marcha (una sola vez)

### 1. Subir a GitHub
```bash
git remote add origin https://github.com/<tu-usuario>/maruchan-dashboard.git
git push -u origin main
```

### 2. Conectar a Vercel
1. Entra a https://vercel.com → **Add New… → Project**.
2. Importa el repo `maruchan-dashboard`.
3. Framework preset: **Other** (es estático, sin build). Deploy.
4. Te queda una URL pública tipo `https://maruchan-dashboard.vercel.app`.

### 3. Configurar la API key de Windsor (para el refresco diario)
1. Saca tu API key en https://onboard.windsor.ai → **API**.
2. En GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `WINDSOR_API_KEY`
   - Value: *(tu key)*
3. Listo. El workflow corre solo cada día; para probarlo ya, ve a **Actions → Refresco diario → Run workflow**.

## Refrescar manualmente en local
```bash
WINDSOR_API_KEY=xxxxx node refresh.js
```

## Previsualizar en local
```bash
node server.js   # luego abre http://127.0.0.1:8765
```
