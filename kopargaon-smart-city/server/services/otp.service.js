import axios from 'axios';

// In-memory store for OTPs (phone -> { otp, expiresAt })
const otpStore = new Map();

export const otpService = {
  sendOtp: async (phone) => {
    // DEV_MODE logic: Don't send real SMS, just log it.
    if (process.env.DEV_MODE === 'true') {
      console.log(`[DEV_MODE] Mock OTP sent to ${phone}: 123456`);
      otpStore.set(phone, {
        otp: '123456',
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
      });
      return { success: true, message: 'OTP sent successfully (DEV_MODE)' };
    }

    // Generate real OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it
    otpStore.set(phone, {
      otp: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
    });

    try {
      // MSG91 API call (example)
      // If MSG91_AUTH_KEY is missing, we fail gracefully.
      if (!process.env.MSG91_AUTH_KEY) {
        console.warn('MSG91_AUTH_KEY is not set. OTP generated but not sent via SMS.');
        return { success: true, message: 'OTP generated but SMS provider not configured.' };
      }

      await axios.get(`https://api.msg91.com/api/v5/otp`, {
        params: {
          template_id: process.env.MSG91_TEMPLATE_ID || 'dummy_template',
          mobile: phone,
          authkey: process.env.MSG91_AUTH_KEY,
          otp: generatedOtp
        }
      });
      
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('[OTP Service] Failed to send OTP:', error.message);
      throw new Error('Failed to send OTP via SMS provider');
    }
  },

  verifyOtp: (phone, otpInput) => {
    const record = otpStore.get(phone);
    if (!record) return false;
    
    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone);
      return false; // expired
    }

    if (record.otp === otpInput) {
      otpStore.delete(phone); // clear on success
      return true;
    }
    
    return false;
  }
};
