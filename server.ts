import express from 'express';
import { createServer as createViteServer } from 'vite';
import { resolve } from 'path';

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(resolve('dist/index.html'));
});

// Configure Vite or Static Assets based on environment
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounting development server (Vite)...');
  } else {
    const distPath = resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(resolve(distPath, 'index.html'));
    });
    console.log('Serving production build assets from:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QR Guard Service booted successfully! Outlets available at: http://0.0.0.0:${PORT}`);
  });
}

start();