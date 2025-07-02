import { WebSocketServer } from 'ws';
import { updateUserLocation } from '../application/updateUserLocation.js';
import { getNearbyUsers } from '../application/getNearbyUsers.js'; // <-- asegúrate de tener esta línea
import dotenv from 'dotenv';
dotenv.config();

export function initWebSocketServer(server) {
   const wss = new WebSocketServer({ server }); // Usa el mismo servidor

  wss.on('connection', (ws) => {
    console.log('📡 Cliente conectado');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.action === 'getNearbyByUserId') {
          // Busca usuarios cercanos basados en userId
          if (!data.userId) throw new Error('Falta userId para buscar cercanos por usuario');
          const radius = data.radius || 10;
          const nearby = await getNearbyUsers({ userId: data.userId, radius });
          ws.send(JSON.stringify({ nearby }));
        } else if (data.action === 'getNearbyByCoords') {
          // Busca usuarios cercanos basado en lat/lon
          if (typeof data.lat === 'undefined' || typeof data.lon === 'undefined') {
            throw new Error('Faltan lat y lon para buscar cercanos por coordenadas.');
          }
          const radius = data.radius || 10;
          const nearbyRaw = await findNearbyUsers({ lon: data.lon, lat: data.lat, radius });
          // nearbyRaw viene en formato [ [userId, dist, [lon, lat]], ... ]
          const nearby = nearbyRaw.map(([id, dist, [lon, lat]]) => ({
            userId: id,
            distance: parseFloat(dist),
            lat: parseFloat(lat),
            lon: parseFloat(lon),
          }));
          ws.send(JSON.stringify({ nearby }));
        } else if (data.userId && typeof data.lat !== 'undefined' && typeof data.lon !== 'undefined') {
          await updateUserLocation(data);
          console.log(`📍 Ubicación actualizada para ${data.userId}: ${data.lat}, ${data.lon}`);
          ws.send(JSON.stringify({ success: true }));
        } else {
          throw new Error('Datos no reconocidos: se esperaba action=getNearbyByUserId o getNearbyByCoords, o userId+lat+lon.');
        }
      } catch (err) {
        console.error('❌ Error procesando mensaje:', err.message);
        ws.send(JSON.stringify({ error: err.message }));
      }
    });


    ws.on('close', () => {
      console.log('🔌 Cliente desconectado');
    });
  });

  console.log(`🛰️ Servidor WS corriendo en puerto ${process.env.PORT}`);
}
