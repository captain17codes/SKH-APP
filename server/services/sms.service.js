import twilio from 'twilio';

// Twilio credentials from env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize client only if credentials exist
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const smsService = {
  sendSms: async (to, message) => {
    // If in DEV_MODE or missing credentials, just log it
    if (process.env.DEV_MODE === 'true' || !client) {
      console.log(`[DEV MODE SMS] To: ${to} | Message: ${message}`);
      return { success: true, mock: true };
    }

    try {
      const response = await client.messages.create({
        body: message,
        from: twilioNumber,
        to
      });
      console.log(`[SMS] Sent successfully to ${to}, SID: ${response.sid}`);
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('[SMS ERROR]', error);
      throw new Error('Failed to send SMS');
    }
  }
};
