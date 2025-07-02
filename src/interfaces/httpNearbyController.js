import { getNearbyUsers } from '../application/getNearbyUsers.js';

export async function httpGetNearbyByUserId(req, res) {
  try {
    const { userId, radius } = req.body; // Cambiado a req.body para JSON
    if (!userId) {
      return res.status(400).json({ error: 'Falta userId' });
    }
    const nearby = await getNearbyUsers({ userId, radius: Number(radius) || 10 });
    res.json({ nearby });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}