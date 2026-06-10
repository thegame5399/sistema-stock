const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI;
const dbName = 'ferre';
let client;

async function main() {
 try {
  client = new MongoClient(url);
  await client.connect();
  console.log('Conectado a MongoDB Atlas');
  const db = client.db(dbName);

  const server = http.createServer(async (req, res) => {
    // Configuración CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Normalizador de URL (Evita el error "Ruta no encontrada" por barras / extra o parametros)
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const parsedUrl = new URL(req.url, baseURL);
    let pathname = parsedUrl.pathname;
   
    // Remover barra final si existe (excepto si es solo '/')
    if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    if (pathname === '/' && req.method === 'GET') {
      fs.readFile('index.html', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error al cargar el archivo HTML');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    }
    else if(pathname === '/productos' && req.method === 'POST'){
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const producto = JSON.parse(body);
          await db.collection('productos').insertOne(producto);
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok: true }));
        } catch(err) {
          console.error(err);
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
    }
    else if(pathname === '/productos' && req.method === 'GET') {
      try {
        const productos = await db.collection('productos').find({}).toArray();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(productos));
      } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    else if(pathname === '/productos/sumar' && req.method === 'POST') {
      let body ='';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const datos = JSON.parse(body);
          await db.collection('productos').updateOne(
            { ID: datos.id },
            { $inc: { Stock: datos.cantidad } }
          );
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok: true }));
        } catch(err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
    else if (pathname === '/ventas' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const venta = JSON.parse(body);
          venta.fecha = new Date();
         
          // Guardar venta
          await db.collection('ventas').insertOne(venta);
         
          // Descontar stock
          await db.collection('productos').updateOne(
            { ID: venta.productoID },
            { $inc: { Stock: -venta.cantidad } }
          );
         
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok: true }));
        } catch(err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
    else if (pathname === '/ventas' && req.method === 'GET') {
      try {
        const ventas = await db.collection('ventas').find({}).sort({fecha: -1}).toArray();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(ventas));
      } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    else if (pathname === '/mensajes' && req.method === 'GET') {
      try {
        const docs = await db.collection('mensaje').find({}).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(docs));
      } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
      }
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
 } catch (err) {
  console.error('Error inicializando MongoDB:', err);
 }
}

main().catch(err => {
  console.error('ERROR FATAL:', err);
  process.exit(1);
});