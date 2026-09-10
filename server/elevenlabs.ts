import { ElevenLabsClient } from 'elevenlabs';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=elevenlabs',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('ElevenLabs not connected');
  }
  return connectionSettings.settings.api_key;
}

export async function getUncachableElevenLabsClient() {
  const apiKey = await getCredentials();
  return new ElevenLabsClient({ apiKey });
}

export async function getElevenLabsApiKey() {
  return await getCredentials();
}

const VOICE_ID = 'eSsKYR3BasKvhJghjsCX';

export async function textToSpeech(text: string): Promise<Buffer> {
  const client = await getUncachableElevenLabsClient();
  const audioStream = await client.textToSpeech.convert(VOICE_ID, {
    text,
    model_id: 'eleven_flash_v2_5',
    output_format: 'mp3_44100_128',
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function speechToText(audioBuffer: Buffer, filename: string): Promise<string> {
  const client = await getUncachableElevenLabsClient();

  const file = new File([audioBuffer], filename, { type: "audio/webm" });
  const result = await client.speechToText.convert({
    file,
    model_id: "scribe_v1",
  });

  return result.text;
}
