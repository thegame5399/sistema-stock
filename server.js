const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI
const dbName = 'ferre';
const client = new MongoClient(url);

async function main() {
  await client.connect();
  console.log('Conectado a MongoDB Atlas');
  const db = client.db(dbName);
  const collection = db.collection('mensajes');

  const server = http.createServer(async (req, res) => {
    if (req.url === '/' && req.method === 'GET') {
      // Servir el HTML
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
    else if (req.url === '/mensajes' && req.method === 'GET') {
      // Obtener datos de Mongo y devolver JSON
      const docs = await collection.find({}).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(docs));
    }
    else {
      res.writeHead(404);
      res.end('Ruta no encontrada');
    }
  });
const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log('Servidor iniciado en http://localhost:${PORT}');
  });
}

main().catch(console.error);