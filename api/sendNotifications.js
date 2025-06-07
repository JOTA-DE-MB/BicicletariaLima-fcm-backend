const admin = require('../lib/firebaseAdmin');

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

    const target = targetUserId ? 'support_${targetUserId}' : targetTopic;

	// --- NOVO LOG DE DEPURACAO ---
    console.log('sendNotifications.js: Valor do tópico sendo enviado:', target);
    // --- FIM NOVO LOG DE DEPURACAO ---


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

    // --- CORREÇÃO APLICADA AQUI: USANDO admin.messaging().send() ---
    const response = await admin.messaging().send({
      topic: target, // O alvo agora é uma propriedade 'topic' dentro do objeto de mensagem
      ...payload,    // Inclui as propriedades notification e data
    });
    // --- FIM DA CORREÇÃO ---

    console.log('Mensagem enviada com sucesso:', response);
    return res.status(200).json({ success: true, messageId: response.messageId });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    console.error('Detalhes do erro:', error.message);
    console.error('Nome do erro:', error.name);
    console.error('Stack do erro:', error.stack);

    return res.status(500).json({
      error: 'Falha ao enviar notificação.',
      details: error.message,
    });
  }
};