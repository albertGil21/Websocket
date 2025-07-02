import { initWebSocketServer } from './src/interfaces/wsServer.js';
import express from 'express';
import http from 'http';
import httpRoutes from './src/interfaces/httpRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Unifica el puerto

app.use(express.json());
app.use('/api', httpRoutes);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP+WS escuchando en puerto ${PORT}`);
});

initWebSocketServer(server); // Pasa el servidor HTTP al WS
