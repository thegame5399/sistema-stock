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
    // NUEVA RUTA: GUARDAR SECCIÓN DE UN PRODUCTO ESPECÍFICO (Para evitar que se pierda al recargar)
    else if(pathname === '/productos/seccion' && req.method === 'POST') {
      let body ='';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const datos = JSON.parse(body);
          await db.collection('productos').updateOne(
            { ID: Number(datos.id) },
            { $set: { seccion: datos.seccion } }
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
    // RUTA DE PEDIDOS CORREGIDA (Elimina el _id antes de actualizar)
    else if (pathname === '/pedidos' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async() => {
        try {
          const pedido = JSON.parse(body);
         
          // SOLUCCIÓN AL ERROR: Remover el _id para que MongoDB no rechace la actualización del objeto inmutable
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


El mié, 10 jun 2026 a la(s) 9:34 a.m., Valentín Fuentealba (valentinfuentealba5@gmail.com) escribió:
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

El mié, 10 jun 2026 a la(s) 9:15 a.m., Valentín Fuentealba (valentinfuentealba5@gmail.com) escribió:
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

El mié, 10 jun 2026 a la(s) 8:56 a.m., Ferretería Milusos (milusosferreteria@gmail.com) escribió:
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