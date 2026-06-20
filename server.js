#!/usr/bin/env node
/** Servidor estático mínimo para previsualizar el dashboard en local. */
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html':'text/html', '.json':'application/json', '.js':'text/javascript', '.css':'text/css' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(__dirname, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(8765, '127.0.0.1', () => console.log('Dashboard en http://127.0.0.1:8765'));
