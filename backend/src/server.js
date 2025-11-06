const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const multipart = require('@fastify/multipart');

// Load environment variables
require('dotenv').config();

// Middleware
const { registerObservability, logError, log } = require('./middleware/observability');
const { registerAuth } = require('./middleware/auth');

// Routes
const registerRoutes = require('./routes');
const { createDependencies } = require('./config/dependencies');

// Initialize Fastify
const app = Fastify({ logger: false });

// Register plugins
app.register(cors, { origin: true });
app.register(multipart);

// Register observability (logging & metrics)
registerObservability(app);

// Register auth middleware (disabled by default for dev)
registerAuth(app, { enableAuth: process.env.ENABLE_AUTH === 'true' });

// Create dependency graph (repositories/services)
const dependencies = createDependencies();

// Register all routes with dependencies (allows DI and incremental migration)
registerRoutes(app, dependencies);

// Serve uploaded files from public directory
app.register(fastifyStatic, { 
  root: path.join(__dirname, '..', 'public'), 
  prefix: '/public/' 
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    log('info', 'Backend server listening on http://localhost:3001');
    log('info', 'API Health Check: http://localhost:3001/api/health');
  } catch (e) {
    logError(e, { context: 'Server startup' });
    process.exit(1);
  }
};

start();

