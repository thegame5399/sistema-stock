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
    // Configuracion CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Normalizador de URL
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const parsedUrl = new URL(req.url, baseURL);
    let pathname = parsedUrl.pathname;
   
          await db.collection('ventas').insertOne(venta);
         
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
    // NUEVA RUTA: OBTENER PEDIDOS
    else if (pathname === '/pedidos' && req.method === 'GET') {
      try {
        const pedidos = await db.collection('pedidos').find({}).toArray();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(pedidos));
      } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    // NUEVA RUTA: GUARDAR O ACTUALIZAR PEDIDO
    else if (pathname === '/pedidos' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const pedido = JSON.parse(body);
          await db.collection('pedidos').updateOne(
            { id: pedido.id },
            { $set: pedido },
            { upsert: true }
          );
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok: true }));
        } catch(err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
    // NUEVA RUTA: OBTENER CONFIGURACION GENERAL (Contraseña y Secciones)
    else if (pathname === '/config' && req.method === 'GET') {
      try {
        let config = await db.collection('config').findOne({ _id: 'ajustes_tienda' });
        if (!config) {
          config = { _id: 'ajustes_tienda', passwordReportes: "1234", secciones: ["General"] };
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(config));
      } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    // NUEVA RUTA: GUARDAR CONFIGURACION GENERAL
    else if (pathname === '/config' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const data = JSON.parse(body);
          await db.collection('config').updateOne(
            { _id: 'ajustes_tienda' },
            { $set: data },
            { upsert: true }
          );
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ ok: true }));
        } catch(err) {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: err.message }));
        }
      });
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