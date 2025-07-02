import { WebSocketServer } from 'ws';
import { updateUserLocation } from '../application/updateUserLocation.js';
import { getNearbyUsers } from '../application/getNearbyUsers.js';
import dotenv from 'dotenv';

// --- NUEVO: Importa los manejadores de negociación ---
import {
  handleServiceProposal,
  handleCounterOffer,
  handleAcceptOffer,
  handleCancelNegotiation
} from '../handlers/negotiationHandler.js';

dotenv.config();

// --- NUEVO: Mapa para rastrear las conexiones activas ---
const connectedClients = new Map();

export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('📡 Cliente conectado');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // --- MODIFICADO: Asocia el userId con la conexión ws ---
        // Esto es clave para poder enviar mensajes a usuarios específicos
        if (data.userId) {
          connectedClients.set(data.userId.toString(), ws);
        }

        // --- MODIFICADO: Router de acciones ---
        switch (data.action) {
          // Casos de negociación
          case 'propose_service':
            await handleServiceProposal(data, connectedClients);
            break;
          case 'counter_offer':
            await handleCounterOffer(data, connectedClients);
            break;
          case 'accept_offer':
            await handleAcceptOffer(data, connectedClients);
            break;
          case 'cancel_negotiation':
            await handleCancelNegotiation(data, connectedClients);
            break;

          // Casos existentes de geolocalización
          case 'getNearbyByUserId':
            if (!data.userId) throw new Error('Falta userId para buscar cercanos');
            const nearby = await getNearbyUsers({ userId: data.userId, radius: data.radius || 10 });
            ws.send(JSON.stringify({ nearby }));
            break;
          
          default:
            // Lógica por defecto para actualizar la ubicación
            if (data.userId && typeof data.lat !== 'undefined' && typeof data.lon !== 'undefined') {
              await updateUserLocation(data);
              // No es necesario enviar una respuesta de éxito para cada actualización
            } else {
              throw new Error('Acción no reconocida o datos incompletos.');
            }
        }
      } catch (err) {
        console.error('❌ Error procesando mensaje:', err.message);
        ws.send(JSON.stringify({ error: err.message }));
      }
    });

    ws.on('close', () => {
      console.log('🔌 Cliente desconectado');
      // --- NUEVO: Limpia el mapa cuando un cliente se desconecta ---
      for (const [userId, clientWs] of connectedClients.entries()) {
        if (clientWs === ws) {
          connectedClients.delete(userId);
          console.log(`Cliente ${userId} eliminado de conexiones activas.`);
          break;
        }
      }
    });
  });

  console.log(`🛰️ Servidor WS iniciado.`);
}