const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI;
const dbName = 'ferre';
const client = new MongoClient(url);

async function main() {
 try {
  await client.connect();
  console.log('conectando a MongoDB atlas');
  const db = client.db(dbName);

  const server = http.createServer(async (req, res) => {
    // CORS para que no rompa desde el navegador
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/' && req.method === 'GET') {
      fs.readFile('index.html', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error al cargar el archivo');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    }
    else if(req.url === '/productos' && req.method === 'POST'){
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try{
          const producto = JSON.parse(body);
          await db.collection('productos').insertOne(producto);
          res.writeHead(200,{'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok:true}));
        }catch(err) {
          console.error(err);
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok:false, error: err.message})); // strigify -> stringify
        }
      });
    }
    else if(req.url === '/productos' && req.method === 'GET') {
      const productos = await db.collection('productos').find({}).toArray();
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(productos));
    }
    else if(req.url === '/productos/sumar' && req.method === 'POST') {
      let body ='';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const datos = JSON.parse(body);
          await db.collection('productos').updateOne(
            {ID: datos.id}, // sin espacio: datos.id
            {$inc:{ Stock: datos.cantidad}}
          );
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ok: true}));
        } catch(err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: err.message}));
        }
      });
    }
    else if (req.url === '/ventas' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const venta = JSON.parse(body);
          venta.fecha = new Date(); // new date() -> new Date()
          
          // 1. Guardar venta
          await db.collection('ventas').insertOne(venta);
          
          // 2. Descontar stock
          await db.collection('productos').updateOne(
            {ID: venta.productoID},
            {$inc: { Stock: -venta.cantidad}}
          );
          
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ok: true}));
        } catch(err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: err.message}));
        }
      });
    }
    else if (req.url === '/ventas' && req.method === 'GET') {
      const ventas = await db.collection('ventas').find({}).sort({fecha: -1}).toArray();
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(ventas));
    }
    else if (req.url === '/mensajes' && req.method === 'GET') {
      const docs = await db.collection('mensaje').find({}).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(docs));
    }
    else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Ruta no encontrada');
    }
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
 }catch (err){ 
  console.error(err);
 }
}

main().catch(err => {
  console.error('ERROR FATAL:', err);
  process.exit(1);
});

