import { redis } from '../infrastructure/redisClient.js';

// Función auxiliar para enviar un mensaje a un usuario específico
function sendMessageToUser(userId, message, connectedClients) {
  const recipientWs = connectedClients.get(userId.toString());

  if (recipientWs && recipientWs.readyState === 1) { // 1 === WebSocket.OPEN
    recipientWs.send(JSON.stringify(message));
    console.log(`📤 Mensaje enviado a ${userId}`);
  } else {
    console.log(`User ${userId} no está conectado. Mensaje no enviado.`);
    // Aquí podrías implementar una notificación push como fallback
  }
}

// Maneja la propuesta inicial del cliente
export async function handleServiceProposal(data, connectedClients) {
  const { negotiationId, toUserId, fromUserId, payload } = data;
  const negotiationKey = `negotiation:${negotiationId}`;

  // Guarda la propuesta en Redis con un tiempo de vida (ej: 1 hora)
  const negotiationState = {
    status: 'pending_technician_approval',
    clientId: fromUserId,
    technicianId: toUserId,
    ...payload,
    history: [payload] // Guarda la primera oferta en el historial
  };
  await redis.set(negotiationKey, JSON.stringify(negotiationState), 'EX', 3600);

  // Reenvía la propuesta al técnico
  sendMessageToUser(toUserId, data, connectedClients);
}

// Maneja la contraoferta del técnico
export async function handleCounterOffer(data, connectedClients) {
    const { negotiationId, toUserId, payload } = data;
    const negotiationKey = `negotiation:${negotiationId}`;

    // Actualiza el estado en Redis
    const currentStateRaw = await redis.get(negotiationKey);
    if (!currentStateRaw) return; // La negociación expiró o no existe

    const currentState = JSON.parse(currentStateRaw);
    currentState.status = 'pending_client_approval';
    currentState.lastAmount = payload.newAmount;
    currentState.history.push(payload); // Añade al historial

    await redis.set(negotiationKey, JSON.stringify(currentState), 'EX', 3600);
    
    // Reenvía la contraoferta al cliente
    sendMessageToUser(toUserId, data, connectedClients);
}

// Maneja la aceptación de una oferta (por cualquiera de las partes)
export async function handleAcceptOffer(data, connectedClients) {
  const { negotiationId, toUserId } = data;
  const negotiationKey = `negotiation:${negotiationId}`;

  // Elimina la negociación de Redis ya que se completó
  await redis.del(negotiationKey);
  
  // Notifica a la otra parte que la oferta fue aceptada
  sendMessageToUser(toUserId, data, connectedClients);

  // Aquí es donde el servidor debería hacer una llamada a la API HTTP
  // para guardar la solicitud de servicio en la base de datos principal.
  console.log(`✅ Negociación ${negotiationId} aceptada. Lista para guardar en DB.`);
}

// Maneja la cancelación de la negociación
export async function handleCancelNegotiation(data, connectedClients) {
    const { negotiationId, toUserId } = data;
    const negotiationKey = `negotiation:${negotiationId}`;

    await redis.del(negotiationKey); // Elimina la negociación

    sendMessageToUser(toUserId, data, connectedClients);
    console.log(`❌ Negociación ${negotiationId} cancelada.`);
}