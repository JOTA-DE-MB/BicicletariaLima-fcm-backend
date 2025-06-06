// api/sendNotifications.js

import admin from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { conversationId, senderId, title, body, targetUserId, targetTopic } = req.body;

    if (!title || !body || (!targetUserId && !targetTopic)) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: title, body e targetUserId ou targetTopic são necessários.',
      });
    }

    const target = targetUserId ? support_${targetUserId} : targetTopic;

    const payload = {
      notification: {
        title,
        body,
        sound: 'default',
      },
      data: {
        conversationId: conversationId || 'n/a',
        senderId: senderId || 'n/a',
      },
    };

    const response = await admin.messaging().sendToTopic(target, payload);

    console.log('Mensagem enviada com sucesso:', response);
    return res.status(200).json({ success: true, messageId: response.messageId });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({
      error: 'Falha ao enviar notificação.',
      details: error.message,
    });
  }
}