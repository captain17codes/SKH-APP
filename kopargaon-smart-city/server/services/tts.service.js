import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import axios from 'axios';

// Helper function to remove markdown formatting and UI-only symbols
function stripMarkdownForTTS(text) {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s?/g, '') // remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/[_~`]/g, '') // backticks, code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links e.g. [name](link) -> name
    // remove UI symbols, bullet points, emoji
    .replace(/^[-*•✓✕⭐📊📋📍💡🚨🏥🤖🚧🟣🔴🟠🟢]\s?/gm, '')
    // replace emojis in line
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // standard emoji range
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

class TtsService {
  constructor() {
    this.client = null;
  }

  async synthesizeElevenLabs(text) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EST9Ui6982FZPSi7gCHi';

    const isApiKeyLoaded = Boolean(apiKey && !apiKey.includes('YOUR_KEY'));
    const isVoiceIdLoaded = Boolean(voiceId);

    console.log('----------------------------------------');
    console.log('🔊 [TTS RUNTIME REQUEST]');
    console.log('TTS PROVIDER: ElevenLabs');
    console.log(`ELEVENLABS_API_KEY LOADED: ${isApiKeyLoaded ? 'YES (' + apiKey.substring(0, 4) + '***)' : 'NO'}`);
    console.log(`ELEVENLABS_VOICE_ID LOADED: ${isVoiceIdLoaded ? 'YES (' + voiceId + ')' : 'NO'}`);
    console.log(`REQUEST ENDPOINT: https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
    console.log('----------------------------------------');

    if (!isApiKeyLoaded) {
      console.warn(`[TTS Warning] ELEVENLABS_API_KEY is not set or invalid in environment (.env). Skipping ElevenLabs.`);
      return null;
    }
    if (!isVoiceIdLoaded) {
      console.warn(`[TTS Warning] ELEVENLABS_VOICE_ID is not set in environment (.env). Skipping ElevenLabs.`);
      return null;
    }
    
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          responseType: 'arraybuffer',
          timeout: 15000
        }
      );
      if (response && response.data) {
        console.log(`[TTS] ✅ ElevenLabs API Request Succeeded! HTTP Status: ${response.status}. Voice ID used: ${voiceId}`);
        return Buffer.from(response.data);
      }
    } catch (e) {
      const status = e.response ? e.response.status : 'NO_RESPONSE';
      console.error(`[TTS Error] ElevenLabs API request failed with HTTP Status ${status}:`, e.message);
      if (e.response && e.response.data) {
        try {
          const errBody = Buffer.from(e.response.data).toString('utf-8');
          console.error(`[TTS Error Detail]:`, errBody);
        } catch {}
      }
    }
    return null;
  }

  getClient() {
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credsPath || !fs.existsSync(credsPath)) {
      return null;
    }
    if (!this.client) {
      this.client = new textToSpeech.TextToSpeechClient();
    }
    return this.client;
  }

  async synthesizeSpeech(text, languageCode = 'en-IN') {
    const cleanedText = stripMarkdownForTTS(text);
    if (!cleanedText) {
      throw new Error("Text content is empty after cleaning.");
    }

    // 1. Try ElevenLabs first with the exact configured Voice ID
    const elevenLabsAudio = await this.synthesizeElevenLabs(cleanedText);
    if (elevenLabsAudio) {
      return elevenLabsAudio;
    }

    // 2. Try Google Cloud TTS
    const client = this.getClient();
    if (!client) {
      throw new Error("TTS provider (ElevenLabs / Google Cloud TTS) is not configured with active credentials.");
    }

    const cleanLang = languageCode.replace('_', '-');
    let primaryVoice = '';
    let fallbacks = [];

    if (cleanLang.toLowerCase().startsWith('mr')) {
      primaryVoice = 'mr-IN-Neural2-A';
      fallbacks = ['mr-IN-Wavenet-A', 'mr-IN-Standard-A'];
    } else if (cleanLang.toLowerCase().startsWith('hi')) {
      primaryVoice = 'hi-IN-Neural2-A';
      fallbacks = ['hi-IN-Wavenet-A', 'hi-IN-Wavenet-B', 'hi-IN-Standard-A'];
    } else {
      primaryVoice = 'en-IN-Neural2-A';
      fallbacks = ['en-IN-Wavenet-A', 'en-IN-Wavenet-B', 'en-IN-Standard-A'];
    }

    const voicesToTry = [primaryVoice, ...fallbacks];
    const baseRequest = {
      input: { text: cleanedText },
      voice: {
        languageCode: cleanLang,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };

    for (const voiceName of voicesToTry) {
      try {
        console.log(`[TTS] Requesting voice: ${voiceName}`);
        const request = {
          ...baseRequest,
          voice: {
            ...baseRequest.voice,
            name: voiceName
          }
        };
        const [response] = await client.synthesizeSpeech(request);
        if (response && response.audioContent) {
          console.log(`[TTS] Successfully synthesized with voice: ${voiceName}`);
          return response.audioContent;
        }
      } catch (error) {
        console.warn(`[TTS] Voice ${voiceName} failed:`, error.message);
      }
    }

    // Final fallback: generic voice for language
    try {
      console.log(`[TTS] Falling back to generic female voice for language: ${cleanLang}`);
      const [response] = await client.synthesizeSpeech(baseRequest);
      if (response && response.audioContent) {
        return response.audioContent;
      }
    } catch (error) {
      console.error(`[TTS] All voice synthesis attempts failed:`, error.message);
      throw error;
    }

    throw new Error("Failed to synthesize speech audio.");
  }
}

export const ttsService = new TtsService();
export default ttsService;
