'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Set(['index.html','styles.css','strategy-data.js','engine.js','app.js']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=url.pathname==='/' ? 'index.html' : url.pathname.slice(1);
  if (!allowed.has(file)) {res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});
  fs.createReadStream(path.join(root,file)).pipe(res);
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('AoF preview: http://127.0.0.1:'+server.address().port));
