#!/usr/bin/env node
/**
 * Refresca data/dashboard.json con datos REALES de Meta (Axon Pharma Colombia).
 * Requiere Node 18+ (fetch nativo) y la variable de entorno WINDSOR_API_KEY.
 *
 * Uso:
 *   WINDSOR_API_KEY=xxxxx node refresh.js
 */
const fs = require('fs');
const path = require('path');

// Acepta tanto la key sola como una URL completa pegada por error (extrae lo que va tras api_key=)
const RAW_KEY    = (process.env.WINDSOR_API_KEY || '').trim();
const API_KEY    = (RAW_KEY.match(/api_key=([^&\s]+)/i)?.[1] || RAW_KEY).trim();
const ACCOUNT_ID = '1211531357024604';            // Axon Pharma Colombia
const CONNECTOR  = 'facebook';
const DATE_PRESET= 'last_90d';
const TOP_ADS    = 12;

if (!API_KEY) { console.error('ERROR: falta WINDSOR_API_KEY'); process.exit(1); }

async function fetchData(fields) {
  const url = `https://connectors.windsor.ai/${CONNECTOR}?` + new URLSearchParams({
    api_key: API_KEY, date_preset: DATE_PRESET, fields: fields.join(','),
  });
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`API HTTP ${res.status} (key len=${API_KEY.length}) :: ${body}`);
  }
  const json = await res.json();
  return (json.data || json.result || []).filter(r => String(r.account_id) === ACCOUNT_ID);
}

(async () => {
  // 1) Serie diaria por campaña (esencial — si falla, abortamos)
  let dailyRaw;
  try {
    dailyRaw = await fetchData(['account_id','campaign','objective','date','spend','impressions',
      'reach','frequency','clicks','link_clicks','cpc','cpm','ctr']);
  } catch (e) {
    console.error('FALLO al traer la serie diaria:', e.message);
    process.exit(1);
  }
  const rows = dailyRaw
    .map(r => ({
      campaign: r.campaign, objective: r.objective, date: r.date,
      spend: +r.spend||0, impressions: +r.impressions||0, reach: +r.reach||0,
      frequency: +r.frequency||0, clicks: +r.clicks||0, link_clicks: +r.link_clicks||0,
      cpc: +r.cpc||0, cpm: +r.cpm||0, ctr: +r.ctr||0,
    }))
    .filter(r => r.date && r.impressions > 0)
    .sort((a,b)=> a.date < b.date ? -1 : 1);

  // 2) Creativos con thumbnail (opcional — si falla, seguimos sin tumbar el refresco)
  let ads = [];
  try {
    const adRaw = await fetchData(['account_id','ad_name','campaign','thumbnail_url','image_url',
      'spend','impressions','reach','clicks','link_clicks']);
    ads = adRaw
      .map(r => ({
        ad_name: r.ad_name, campaign: r.campaign,
        thumbnail: r.thumbnail_url || r.image_url || '',
        spend: +r.spend||0, impressions: +r.impressions||0, reach: +r.reach||0,
        clicks: +r.clicks||0, link_clicks: +r.link_clicks||0,
      }))
      .filter(a => a.thumbnail && /^http/.test(a.thumbnail) && a.spend > 0)
      .sort((a,b)=> b.spend - a.spend)
      .slice(0, TOP_ADS);
  } catch (e) {
    console.error('Aviso: no se pudieron traer los creativos (se mantiene el resto):', e.message);
  }

  const out = {
    updated: new Date().toISOString(),
    account: { id: ACCOUNT_ID, name: 'Axon Pharma Colombia', connector: CONNECTOR, currency: 'COP' },
    filter: 'AxonPharma',
    rows,
    ads,
  };

  const file = path.join(__dirname, 'data', 'dashboard.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`OK · ${rows.length} filas · ${new Set(rows.map(r=>r.campaign)).size} campañas · ${ads.length} creativos · ${file}`);
})().catch(e => { console.error(e); process.exit(1); });
