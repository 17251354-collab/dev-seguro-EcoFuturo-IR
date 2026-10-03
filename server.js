import http from 'http';
import fs from 'fs';
import path from 'path';
const port = parseInt(process.argv[2]) || 8080;
http.createServer((q, r) => {
    let urlPath = (q.url === '/' ? 'index.html' : q.url.split('?')[0]).replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
    let fp = path.join('.', urlPath);
    fs.readFile(fp, (e, d) => {
        if (e) { r.writeHead(404); r.end('Not found'); return; }
        let ext = path.extname(fp),
            ct = { 'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'png': 'image/png' }[ext.slice(1)] || 'text/plain';
        r.writeHead(200, { 'Content-Type': ct }); r.end(d);
    });
}).listen(port, () => console.log(`http://localhost:${port}`));
