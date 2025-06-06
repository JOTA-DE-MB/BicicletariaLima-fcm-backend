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

    // --- Início dos Logs de Depuração Críticos ---
    console.log('sendNotifications.js: Iniciando envio de notificação.');
    console.log('sendNotifications.js: Verificando objeto admin...');
    console.log('sendNotifications.js: admin é um objeto?', typeof admin === 'object');
    console.log('sendNotifications.js: admin é null?', admin === null);
    console.log('sendNotifications.js: admin.apps.length (deveria ser 1 se inicializado):', admin.apps ? admin.apps.length : 'não disponível');

    if (typeof admin.messaging === 'function') {
      console.log('sendNotifications.js: admin.messaging é uma função. Tentando obter instância de messaging...');
      const messagingInstance = admin.messaging();
      console.log('sendNotifications.js: messagingInstance é um objeto?', typeof messagingInstance === 'object');
      console.log('sendNotifications.js: messagingInstance é null?', messagingInstance === null);
      console.log('sendNotifications.js: messagingInstance.sendToTopic é uma função?', typeof messagingInstance.sendToTopic === 'function');
      
      // Se messagingInstance.sendToTopic não for uma função, vamos tentar logar suas chaves para ver o que ele tem
      if (typeof messagingInstance.sendToTopic !== 'function') {
        console.error('sendNotifications.js: sendToTopic NÃO é uma função na instância de messaging!');
        console.error('sendNotifications.js: Chaves disponíveis em messagingInstance:', Object.keys(messagingInstance || {}));
      }
    } else {
      console.error('sendNotifications.js: admin.messaging NÃO é uma função!');
      console.error('sendNotifications.js: Chaves disponíveis em admin:', Object.keys(admin || {}));
    }
    // --- Fim dos Logs de Depuração Críticos ---

    const response = await admin.messaging().sendToTopic(target, payload);

    console.log('Mensagem enviada com sucesso:', response);
    return res.status(200).json({ success: true, messageId: response.messageId });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    console.error('Detalhes do erro:', error.message);
    console.error('Nome do erro:', error.name);
    console.error('Stack do erro:', error.stack); // Isso pode dar mais contexto sobre de onde veio o erro

    return res.status(500).json({
      error: 'Falha ao enviar notificação.',
      details: error.message,
    });
  }
};