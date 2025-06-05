const admin = require('firebase-admin');
const serviceAccount = require('../firebase-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { targetUserId, targetTopic, title, body, conversationId, senderId } = req.body;

    let target; // Variável para definir o destino da notificação

    if (targetUserId) {
      target = support_${targetUserId};
    } else if (targetTopic) {
      target = targetTopic;
    } else {
      return res.status(400).json({
        error: 'Um destino válido para a notificação (targetUserId ou targetTopic) é necessário.',
      });
    }

    const payload = {
      notification: {
        title: title,
        body: body,
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
};