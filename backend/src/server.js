const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const multipart = require('@fastify/multipart');

// Middleware
const { registerObservability, logError, log } = require('./middleware/observability');
const { registerAuth } = require('./middleware/auth');

// Repositories & Routes
const { createRepositories } = require('./repositories');
const registerRoutes = require('./routes');

// Initialize Fastify
const app = Fastify({ logger: false });

// Register plugins
app.register(cors, { origin: true });
app.register(multipart);

// Database setup
const DB_PATH = path.join(__dirname, '..', 'db', 'dev.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new sqlite3.Database(DB_PATH);

// Run migrations
const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'sqlite-schema.sql'), 'utf8');
db.exec(schema);

// Register observability (logging & metrics)
registerObservability(app);

// Register auth middleware (disabled by default for dev)
registerAuth(app, { enableAuth: process.env.ENABLE_AUTH === 'true' });

// Initialize repositories
const repositories = createRepositories(db);

// Register all routes
registerRoutes(app, repositories);

// Serve uploaded files for demo from public/uploads
app.register(fastifyStatic, { 
  root: path.join(__dirname, '..', 'public'), 
  prefix: '/public/' 
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    log('info', '🚀 Backend server listening on http://localhost:3001');
  } catch (e) {
    logError(e, { context: 'Server startup' });
    process.exit(1);
  }
};

start();

