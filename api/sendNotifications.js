// lib/firebaseAdmin.js

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const admin = require('firebase-admin');

module.exports = async (req, res) => {
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

    let target;
    if (targetUserId) {
      target = support_${targetUserId};
    } else {
      target = targetTopic;
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