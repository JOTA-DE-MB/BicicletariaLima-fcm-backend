const admin = require('../lib/firebaseAdmin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { targetUserId, targetTopic, title, body, conversationId, senderId } = req.body;

    if (!title || !body || (!targetUserId && !targetTopic)) {
      return res.status(400).json({
        error: 'Missing required fields: title, body, and either targetUserId or targetTopic.',
      });
    }

    const target = targetUserId ? 'support_${targetUserId}' : targetTopic;

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

    console.log('Message sent successfully:', response);
    return res.status(200).json({ success: true, messageId: response.messageId });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      error: 'Failed to send notification.',
      details: error.message,
    });
  }
};