const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI;
const dbName = 'ferre';
let client;

// Validación inicial preventiva para evitar caídas imprevistas si falta la variable
if (!url) {
  console.error("ERROR CRÍTICO: La variable de entorno MONGO_URI no está configurada.");
}

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

    // Normalizador de URL
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    const parsedUrl = new URL(req.url, baseURL);
    let pathname = parsedUrl.pathname;
   
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
            { $or: [ { ID: datos.id }, { ID: Number(datos.id) }, { ID: String(datos.id) } ] },
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
    else if(pathname === '/productos/seccion' && req.method === 'POST') {
      let body ='';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const datos = JSON.parse(body);
          await db.collection('productos').updateOne(
            { $or: [ { ID: datos.id }, { ID: Number(datos.id) }, { ID: String(datos.id) } ] },
            { $set: { seccion: datos.seccion } }
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
         
          await db.collection('ventas').insertOne(venta);
         
          await db.collection('productos').updateOne(
            { $or: [ { ID: venta.productoID }, { ID: Number(venta.productoID) }, { ID: String(venta.productoID) } ] },
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
    else if (pathname === '/pedidos' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const pedido = JSON.parse(body);
         
          if (pedido._id) {
            delete pedido._id;
          }

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
    else if (pathname === '/config' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const data = JSON.parse(body);
         
          if (data._id) {
            delete data._id;
          }

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
    // NUEVAS RUTAS: GESTIÓN DE PERSONAL
    else if (pathname === '/personal' && req.method === 'GET') {
      try {
        const personal = await db.collection('personal').find({}).toArray();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(personal.map(p => p.nombre)));
      } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    else if (pathname === '/personal' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const data = JSON.parse(body);
          await db.collection('personal').updateOne(
            { nombre: data.nombre },
            { $set: { nombre: data.nombre } },
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
    else if (pathname === '/personal/eliminar' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const data = JSON.parse(body);
          await db.collection('personal').deleteOne({ nombre: data.nombre });
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
