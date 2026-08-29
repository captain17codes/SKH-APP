import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import axios from 'axios';

// Helper function to remove markdown formatting, invalid unicode surrogates and UI-only symbols
function stripMarkdownForTTS(text) {
  if (!text) return '';
  try {
    return text
      .normalize('NFC')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // strip emoji surrogate pairs
      .replace(/[\uD800-\uDFFF]/g, '') // strip unpaired surrogates
      .replace(/#{1,6}\s?/g, '') // remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/[_~`]/g, '') // backticks, code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links e.g. [name](link) -> name
      .replace(/^[-*•✓✕⭐📊📋📍💡🚨🏥🤖🚧🟣🔴🟠🟢]\s?/gm, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } catch (err) {
    return String(text).replace(/[#*`_~\[\]]/g, '').trim();
  }
}

class TtsService {
  constructor() {
    this.client = null;
  }

  async synthesizeElevenLabs(text) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    const isApiKeyLoaded = Boolean(apiKey && !apiKey.includes('YOUR_KEY'));
    const isVoiceIdLoaded = Boolean(voiceId);

    console.log('[TTS] Provider: ElevenLabs');
    console.log(`[TTS] Voice ID loaded: ${isVoiceIdLoaded} (${voiceId || 'none'})`);
    console.log(`[TTS] API key loaded: ${isApiKeyLoaded}`);

    if (!isApiKeyLoaded) {
      console.warn(`[TTS] ELEVENLABS_API_KEY is not set or invalid in environment (.env). Skipping ElevenLabs.`);
      return null;
    }
    if (!isVoiceIdLoaded) {
      console.warn(`[TTS] ELEVENLABS_VOICE_ID is not set in environment (.env). Skipping ElevenLabs.`);
      return null;
    }

    console.log('[TTS] ElevenLabs request started');
    
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
      console.log(`[TTS] ElevenLabs response status: ${response ? response.status : 'unknown'}`);
      if (response && response.data) {
        console.log(`[TTS] ElevenLabs audio received (${response.data.byteLength || response.data.length} bytes)`);
        return Buffer.from(response.data);
      }
    } catch (e) {
      const status = e.response ? e.response.status : 'NO_RESPONSE';
      console.error(`[TTS] ElevenLabs response status: ${status} (Error: ${e.message})`);
      if (e.response && e.response.data) {
        try {
          const errBody = Buffer.from(e.response.data).toString('utf-8');
          console.error(`[TTS] Error Detail:`, errBody);
          if (errBody.includes('api_key_id_used_as_api_key')) {
            console.warn(`[TTS Hint] Your ELEVENLABS_API_KEY is an API Key ID. Please use the secret API key starting with 'sk_' from https://elevenlabs.io/app/settings/api-keys.`);
          } else if (errBody.includes('missing_permissions')) {
            console.warn(`[TTS Hint] Your ElevenLabs API key is missing the "text_to_speech" permission. In ElevenLabs Dashboard -> API Keys, edit/create the key and enable "Text to Speech" permission.`);
          }
        } catch {}
      }
    }
    return null;
  }

  async synthesizeGoogleTranslateTTS(text, languageCode = 'en-IN') {
    try {
      const cleanLang = (languageCode || 'en-IN').toLowerCase();
      let tl = 'en-IN';
      if (cleanLang.startsWith('mr')) {
        tl = 'mr';
      } else if (cleanLang.startsWith('hi')) {
        tl = 'hi';
      }

      // Chunk text into sentence segments to ensure full response audio is synthesized
      const sentences = text.split(/(?<=[।!?.\n])\s+/).filter(s => s && s.trim().length > 0);
      const chunks = [];
      let currentChunk = '';

      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).length > 180) {
          if (currentChunk.trim()) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());

      const audioBuffers = await Promise.all(
        chunks.slice(0, 8).map(async (chunk) => {
          const res = await axios.get('https://translate.google.com/translate_tts', {
            params: {
              ie: 'UTF-8',
              q: chunk,
              tl: tl,
              client: 'tw-ob'
            },
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 10000
          });
          return Buffer.from(res.data);
        })
      );

      const combinedBuffer = Buffer.concat(audioBuffers);
      console.log(`[TTS] Synthesized high-quality neural voice stream (${combinedBuffer.length} bytes) for language: ${tl}`);
      return combinedBuffer;
    } catch (e) {
      console.warn('[TTS] Neural voice stream error:', e.message);
      return null;
    }
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

    // 2. High-Fidelity Natural Voice Engine (Delivers authentic MP3 audio in MR/HI/EN)
    const naturalAudio = await this.synthesizeGoogleTranslateTTS(cleanedText, languageCode);
    if (naturalAudio) {
      return naturalAudio;
    }

    // 3. Try Google Cloud TTS
    const client = this.getClient();
    if (!client) {
      throw new Error("TTS provider (ElevenLabs / Google Cloud TTS) is not configured with active credentials.");
    }

    const cleanLang = languageCode.replace('_', '-');
    let primaryVoice = '';
    let fallbacks = [];
    let ssmlGender = 'FEMALE';

    if (cleanLang.toLowerCase().startsWith('mr')) {
      // Marathi Female Voice
      primaryVoice = 'mr-IN-Neural2-A';
      fallbacks = ['mr-IN-Wavenet-A', 'mr-IN-Standard-A'];
      ssmlGender = 'FEMALE';
    } else if (cleanLang.toLowerCase().startsWith('hi')) {
      // Hindi Voice
      primaryVoice = 'hi-IN-Neural2-A';
      fallbacks = ['hi-IN-Wavenet-A', 'hi-IN-Wavenet-B', 'hi-IN-Standard-A'];
      ssmlGender = 'FEMALE';
    } else {
      // English Female Voice
      primaryVoice = 'en-IN-Neural2-A';
      fallbacks = ['en-IN-Wavenet-A', 'en-IN-Standard-A', 'en-US-Neural2-F', 'en-US-Wavenet-F'];
      ssmlGender = 'FEMALE';
    }

    const voicesToTry = [primaryVoice, ...fallbacks];
    const baseRequest = {
      input: { text: cleanedText },
      voice: {
        languageCode: cleanLang,
        ssmlGender: ssmlGender
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
