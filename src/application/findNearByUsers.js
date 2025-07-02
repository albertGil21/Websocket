import { redis } from '../infrastructure/redisClient.js';

export async function findNearbyUsers({ lon, lat, radius = 3000, unit = 'm' }) {
  return await redis.geosearch(
    'user_locations',
    'FROMLONLAT', lon, lat,
    'BYRADIUS', radius, unit,
    'WITHDIST'
  );
}
