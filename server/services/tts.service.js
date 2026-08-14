import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';

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

  getClient() {
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credsPath || !fs.existsSync(credsPath)) {
      throw new Error("Google Cloud TTS is not configured.");
    }
    if (!this.client) {
      this.client = new textToSpeech.TextToSpeechClient();
    }
    return this.client;
  }

  async synthesizeSpeech(text, languageCode = 'en-IN') {
    const client = this.getClient();
    const cleanedText = stripMarkdownForTTS(text);
    if (!cleanedText) {
      throw new Error("Text content is empty after cleaning.");
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

    // Final fallback: let Google choose any female voice for the language
    try {
      console.log(`[TTS] Falling back to generic female voice for language: ${cleanLang}`);
      const [response] = await client.synthesizeSpeech(baseRequest);
      if (response && response.audioContent) {
        return response.audioContent;
      }
    } catch (error) {
      console.error(`[TTS] Generic fallback failed for language ${cleanLang}:`, error.message);
    }

    throw new Error("Google Cloud TTS is not configured.");
  }

  // Alias for backward compatibility if needed
  async synthesize(text, language) {
    return this.synthesizeSpeech(text, language);
  }
}

export default new TtsService();
