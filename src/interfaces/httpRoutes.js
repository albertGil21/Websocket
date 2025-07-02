import express from 'express';
import { httpGetNearbyByUserId } from './httpNearbyController.js';

const router = express.Router();

router.post('/nearby', httpGetNearbyByUserId); // Cambiado a POST

export default router;