const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI
const dbName = 'ferre';
const client = new MongoClient(url);

async function main() {
 try {
await client.connect();
console.log ('conectando a MongoDB atlas');
const db = client.db (dbname);
const collection = db.collection('mensaje');

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
       else if req.url === '/productos' && req.method === 'POST'){
        let body = '';
        req.on('data', chunk => {
              body += chunk;
         });
         req.on('end', async() => {
         const producto = JSON.parse(body);
        await
  db.collection('productos').insertOne(producto);
  res.writeHead(200.{'Content-Type: 'application/json'});
res.end(JSON.stringify({ ok:true}));});}

else if(req.url ==='/productos'&& req.method === 'GET') {

const productos = await db
     .collection('productos')
     .find({})
     .toArray();
   
     res.writeHead(200, {
          'Content-Type': 'application/json'});
       res.end(JSon.stringify(productos));}
    else if(req.url === '/productos/sumar' && req.method === 'POST') {
  let body ='';
  req.on('end', async() => {
      const datos = JSON.parse(body);

     await
db.collection ('productos').updateOne (
      {ID:datos .id },{
  $inc:{  stock: datos.cantidad}});
res.end('ok');});}
else if (req.url ==='/ventas' && req.method === 'POST') {
   let body = '';
req.on('data'; chunk => { body += chunk;});
req.on('end', async() => {
const datos = JSON.parse(body);

await
db.collection('productos').updateOne({
   ID:  datos.productoID},{
$inc: {stock: -datos.cantidad}});
res.end('ok');});
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

main().catch(err => {
console.error('ERROR FATAL:', err);
process.exit(1);
});