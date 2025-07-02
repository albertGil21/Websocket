import { redis } from '../infrastructure/redisClient.js';

export async function getNearbyUsers({ userId, radius = 100000, unit = 'm' }) {
  const key = 'user_locations';

  const userLocation = await redis.geopos(key, userId);
  if (!userLocation || !userLocation[0]) {
    throw new Error(`El usuario ${userId} no tiene ubicación registrada`);
  }

  const [lon, lat] = userLocation[0];

  const nearby = await redis.georadius(
    key,
    lon, lat,
    radius, unit,
    'WITHDIST',
    'WITHCOORD'
  );

  // Filtrar solo usuarios activos
  const activeNearby = [];
  for (const [id, dist, [lon, lat]] of nearby) {
    const isActive = await redis.exists(`active_user:${id}`);
    if (isActive) {
      activeNearby.push({
        userId: id,
        distance: parseFloat(dist),
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      });
    }
  }
  return activeNearby;
}