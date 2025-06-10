const admin = require('../lib/firebaseAdmin'); // Certifique-se de que este caminho está correto
const { getFirestore } = require('firebase-admin/firestore'); // Importar Firestore
const db = getFirestore(); // Inicializa o Firestore

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      type,            // Ex: 'support_message', 'appointment_confirmation', 'promo'
      senderId,        // UID de quem enviou a ação (usuário ou admin)
      recipientId,     // UID do destinatário específico (se houver, ex: o usuário na conversa com o admin)
      targetTopic,     // Tópico para notificar (ex: 'admin_notifications')
      title,
      body,
      // Dados adicionais para o payload de dados
      conversationId,
      appointmentId,
      promoCode,
      selectedUserIds // Array de UIDs para notificações de promoção
    } = req.body;

    if (!type || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: type, title, body.',
      });
    }

    let fcmTarget = null; // Pode ser um token, um tópico ou um array de tokens
    let isMulticast = false; // Flag para indicar se é envio para múltiplos tokens

    // --- Lógica para determinar o tipo e destinatário da notificação ---
    switch (type) {
      case 'support_message':
        // Notificação de Mensagem de Suporte
        // O remetente pode ser um usuário ou um administrador.
        // Precisamos verificar o papel do remetente para decidir o destinatário.

        const senderDoc = await db.collection('usuários').doc(senderId).get();
        const senderData = senderDoc.data();
        const isSenderAdmin = senderData?.isAdmin || false;

        if (isSenderAdmin) {
          // ADMIN enviou mensagem para um USUÁRIO específico
          if (!recipientId) {
            return res.status(400).json({ error: 'recipientId is required for admin support messages.' });
          }
          const recipientDoc = await db.collection('usuários').doc(recipientId).get();
          const recipientData = recipientDoc.data();
          fcmTarget = recipientData?.fcmToken; // Token do usuário destinatário
          if (!fcmTarget) {
            console.warn(`Token FCM não encontrado para o usuário ${recipientId}. Notificação de suporte do admin não enviada.`);
            return res.status(200).json({ success: false, message: `Token FCM não encontrado para o usuário ${recipientId}.` });
          }
          console.log(`Admin ${senderId} enviando para usuário ${recipientId}. Token: ${fcmTarget.substring(0, 10)}...`);
        } else {
          // USUÁRIO comum enviou mensagem para ADMINISTRADORES (via tópico)
          fcmTarget = '/topics/admin_notifications';
          console.log(`Usuário ${senderId} enviando para admins (tópico: admin_notifications).`);
        }
        break;

      case 'appointment_confirmation':
        // Confirmação de Agendamento para o USUÁRIO (recipientId)
        if (!recipientId) {
          return res.status(400).json({ error: 'recipientId is required for appointment confirmation.' });
        }
        const userDoc = await db.collection('usuários').doc(recipientId).get();
        const userData = userDoc.data();
        fcmTarget = userData?.fcmToken; // Token do usuário que agendou
        if (!fcmTarget) {
          console.warn(`Token FCM não encontrado para o usuário ${recipientId}. Notificação de agendamento não enviada.`);
          // Pode continuar para notificar o admin, mas o usuário não receberá.
        }
        console.log(`Confirmação de agendamento para usuário ${recipientId}. Token: ${fcmTarget ? fcmTarget.substring(0, 10) + '...' : 'N/A'}`);
        break;

      case 'promo':
        // Promoção para USUÁRIOS SELECIONADOS (selectedUserIds)
        if (!selectedUserIds || !Array.isArray(selectedUserIds) || selectedUserIds.length === 0) {
          return res.status(400).json({ error: 'selectedUserIds (array of UIDs) is required for promo notifications.' });
        }
        // Buscar todos os tokens FCM dos usuários selecionados
        const tokens = [];
        for (const userId of selectedUserIds) {
          const userDoc = await db.collection('usuários').doc(userId).get();
          const userData = userDoc.data();
          if (userData?.fcmToken) {
            tokens.push(userData.fcmToken);
          } else {
            console.warn(`Token FCM não encontrado para o usuário ${userId} durante o envio de promo.`);
          }
        }
        if (tokens.length === 0) {
          return res.status(200).json({ success: false, message: 'Nenhum token válido encontrado para os usuários selecionados.' });
        }
        fcmTarget = tokens; // Array de tokens
        isMulticast = true; // Define como envio multicast
        console.log(`Promoção para ${tokens.length} usuários.`);
        break;

      default:
        return res.status(400).json({ error: 'Invalid notification type provided.' });
    }

    if (!fcmTarget) {
      return res.status(200).json({ success: false, message: 'Nenhum destinatário válido para a notificação.' });
    }

    // --- Montar o Payload ---
    const payload = {
      notification: {
        title: title,
        body: body,
        // icon: 'sua_url_do_icone', // Opcional: ícone específico da notificação
        // color: '#ff0000', // Opcional: cor para o ícone pequeno
      },
      data: {
        type: type, // Para que o app saiba como lidar com a notificação
        conversationId: conversationId || '',
        senderId: senderId || '',
        appointmentId: appointmentId || '',
        promoCode: promoCode || '',
        // Adicione outros dados que o aplicativo possa precisar
      },
    };

    let response;
    if (isMulticast) {
      // Envio para múltiplos tokens (promoções)
      response = await admin.messaging().sendEachForMulticast({
        tokens: fcmTarget,
        ...payload,
      });
      console.log(`Multicast message sent: Successes: ${response.successCount}, Failures: ${response.failureCount}`);
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Falha no envio para token ${fcmTarget[idx]}: ${resp.exception?.message}`);
          }
        });
      }
    } else if (typeof fcmTarget === 'string' && fcmTarget.startsWith('/topics/')) {
      // Envio para um tópico
      response = await admin.messaging().send({
        topic: fcmTarget.substring(8), // Remove "/topics/"
        ...payload,
      });
      console.log('Topic message sent successfully:', response);
    } else if (typeof fcmTarget === 'string') {
      // Envio para um único token
      response = await admin.messaging().send({
        token: fcmTarget,
        ...payload,
      });
      console.log('Single token message sent successfully:', response);
    } else {
      return res.status(500).json({ error: 'Invalid FCM target type.' });
    }

    // --- Lógica adicional para o cenário de agendamento (notificar também o admin) ---
    if (type === 'appointment_confirmation' && fcmTarget) { // Já notifica o usuário
        // Agora, notificar o admin sobre o novo agendamento
        const adminPayload = {
            notification: {
                title: `Novo Agendamento: ${title}`, // Título para o admin
                body: `Um novo agendamento foi feito por ${senderId}`. Detalhes: ${body}, // Corpo para o admin
            },
            data: {
                type: 'new_appointment_admin', // Um novo tipo para o app saber que é para o admin
                appointmentId: appointmentId || '',
                userId: senderId || '', // Quem fez o agendamento
                // Adicione outros dados que o admin precisa ver
            },
        };
        try {
            const adminResponse = await admin.messaging().send({
                topic: 'admin_notifications',
                ...adminPayload,
            });
            console.log('New appointment notification sent to admin topic:', adminResponse);
        } catch (adminError) {
            console.error('Error sending appointment notification to admin topic:', adminError);
        }
    }


    return res.status(200).json({ success: true, messageId: response?.messageId || 'N/A' });

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