if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

import admin from 'firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { targetUserId, targetTopic, title, body, conversationId, senderId } = req.body;

    let target;

    if (targetUserId) {
      target = support_${targetUserId};
    } else if (targetTopic) {
      target = targetTopic;
    } else {
      return res.status(400).json({
        error: 'A valid notification target (targetUserId or targetTopic) is required.',
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

    console.log('Message sent successfully:', response);

    return res.status(200).json({ success: true, messageId: response.messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      error: 'Failed to send notification.',
      details: error.message,
    });
  }
}