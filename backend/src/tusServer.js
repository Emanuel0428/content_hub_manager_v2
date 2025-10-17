const path = require('path');
const fs = require('fs');
const { Server } = require('tus-node-server');
const http = require('http');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const server = new Server();
server.datastore = new Server.FileStore({path: uploadDir});

const httpServer = http.createServer((req, res) => {
  server.handle(req, res);
});

httpServer.listen(1080, () => console.log('tus server listening on 1080'));
