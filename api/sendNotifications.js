const admin = require('../lib/firebaseAdmin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { conversationId, senderId, title, body, targetUserId, targetTopic } = req.body;

    if (!title || !body || (!targetUserId && !targetTopic)) {
      return res.status(400).json({
        error: 'Missing required fields: title, body, and either targetUserId or targetTopic.',
      });
    }

    // --- CORREÇÃO FINAL AQUI: USANDO BACKTICKS PARA TEMPLATE LITERAL ---
    const target = targetUserId ? `support_${targetUserId}`: targetTopic;
    // --- FIM DA CORREÇÃO ---

    // Este log foi útil para encontrar o problema, mas pode ser removido agora
    // console.log('sendNotifications.js: Valor do tópico sendo enviado:', target);

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

    // --- Método de envio atualizado para admin.messaging().send() ---
    const response = await admin.messaging().send({
      topic: target,
      ...payload,
    });
    // --- FIM DA ATUALIZAÇÃO ---

    console.log('Message sent successfully:', response);
    return res.status(200).json({ success: true, messageId: response.messageId });

  } catch (error) {
    console.error('Error sending notification:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to send notification.',
      details: error.message,
    });
  }
};