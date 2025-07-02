// src/application/updateUserLocation.js
import { redis } from '../infrastructure/redisClient.js';

export async function updateUserLocation({ userId, lat, lon }) {
  if (!userId || !lat || !lon) {
    throw new Error('Faltan datos: userId, lat, lon son requeridos.');
  }

  const key = `location:${userId}`;
  const locationData = JSON.stringify({
    lat,
    lon,
    timestamp: Date.now()
  });

  // Guardar info extra con TTL
  await redis.set(`active_user:${userId}`, 1, 'EX', 10); // TTL de 10 segundos

  // Guardar coordenadas en set geoespacial
  await redis.geoadd('user_locations', lon, lat, userId);
}
