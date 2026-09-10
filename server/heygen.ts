import { videoScripts, VideoScript, VideoScene } from "./video-scripts";

const HEYGEN_API_URL = "https://api.heygen.com";
const HEYGEN_UPLOAD_URL = "https://upload.heygen.com";

interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url: string;
}

interface HeyGenVoice {
  voice_id: string;
  language: string;
  gender: string;
  name: string;
  preview_audio: string;
  support_pause: boolean;
  emotion_support: boolean;
}

interface HeyGenVideoStatus {
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
  };
}

interface VideoInput {
  character: {
    type: "avatar" | "talking_photo";
    avatar_id?: string;
    avatar_style?: string;
    scale?: number;
    offset?: { x: number; y: number };
  };
  voice: {
    type: "text" | "audio";
    voice_id?: string;
    input_text?: string;
    speed?: number;
  };
  background?: {
    type: "color" | "image" | "video";
    value?: string;
    url?: string;
  };
}

interface CreateVideoRequest {
  video_inputs: VideoInput[];
  dimension?: {
    width: number;
    height: number;
  };
  aspect_ratio?: string;
  test?: boolean;
  callback_id?: string;
}

// Background music options - royalty-free instrumental tracks
const BACKGROUND_MUSIC_URLS = {
  corporate: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3", // Corporate uplifting
  ambient: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1fa0.mp3", // Soft ambient
  inspiring: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3", // Inspiring corporate
  calm: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32e02f9.mp3", // Calm background
};

// Scene transition settings
const SCENE_TRANSITIONS = {
  fade: { type: "fade", duration: 0.5 },
  dissolve: { type: "dissolve", duration: 0.8 },
  slide: { type: "slide_left", duration: 0.5 },
};

// Fallback color backgrounds - used when no image is available
const FALLBACK_COLORS = {
  intro: "#1a365d",      // Navy blue - professional, trustworthy
  office: "#2d3748",     // Dark gray - office/corporate
  data: "#1e40af",       // Deep blue - data/analytics
  technology: "#0f172a", // Slate dark - technology/modern
  people: "#1e3a5f",     // Blue-gray - people/community
  government: "#1a365d", // Navy - government/official
  liberia: "#b91c1c",    // Liberian red - national pride
  map: "#065f46",        // Forest green - geography/environment
  success: "#047857",    // Green - success/achievement
  closing: "#1a365d",    // Navy blue - professional closing
  branded: "#1a365d",    // Primary brand color
};

class HeyGenService {
  private getApiKey(): string {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      throw new Error("HeyGen API key is not configured");
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      "X-API-KEY": this.getApiKey(),
      "Content-Type": "application/json",
    };
  }

  async listAvatars(): Promise<HeyGenAvatar[]> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/avatars`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list avatars: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data?.avatars || [];
  }

  async listVoices(): Promise<HeyGenVoice[]> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/voices`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list voices: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data?.voices || [];
  }

  private buildVideoInputs(
    script: VideoScript,
    avatarId: string,
    voiceId: string,
    isTalkingPhoto: boolean = false,
    avatarType: 'regular' | 'avatar_iv' = 'regular'
  ): VideoInput[] {
    // Build character object based on avatar type
    // Avatar IV uses "live" style for more realistic appearance (but has 30s limit on some plans)
    // Regular avatars: omit avatar_style to use HeyGen's default (non-Avatar IV)
    // Avatar IV mode: use "live" style (more realistic but 30s limit on some plans)
    const buildCharacter = () => {
      if (isTalkingPhoto) {
        return {
          type: "talking_photo" as const,
          talking_photo_id: avatarId,
          scale: 1.0,
        };
      }
      // Only set avatar_style if explicitly requesting Avatar IV
      const character: any = {
        type: "avatar" as const,
        avatar_id: avatarId,
        scale: 0.8,
        offset: { x: 0.3, y: 0 },
      };
      if (avatarType === 'avatar_iv') {
        character.avatar_style = "live";
      }
      return character;
    };

    if (script.scenes && script.scenes.length > 0) {
      return script.scenes.map((scene) => {
        const bgKey = scene.background as keyof typeof FALLBACK_COLORS;
        const fallbackColor = FALLBACK_COLORS[bgKey] || FALLBACK_COLORS.branded;

        return {
          character: buildCharacter(),
          voice: {
            type: "text" as const,
            voice_id: voiceId,
            input_text: scene.text,
            speed: 1.0,
          },
          background: { type: "color" as const, value: fallbackColor },
        };
      });
    }

    return [
      {
        character: buildCharacter(),
        voice: {
          type: "text",
          voice_id: voiceId,
          input_text: script.script,
        },
        background: {
          type: "color",
          value: "#1a365d",
        },
      },
    ];
  }

  async createVideo(
    scriptId: string,
    avatarId: string,
    voiceId: string,
    options?: {
      aspectRatio?: string;
      test?: boolean;
      isTalkingPhoto?: boolean;
      backgroundMusic?: 'corporate' | 'ambient' | 'inspiring' | 'calm' | 'none';
      enableTransitions?: boolean;
      avatarType?: 'regular' | 'avatar_iv';
    }
  ): Promise<string> {
    const script = this.getScriptById(scriptId);
    if (!script) {
      throw new Error(`Script not found: ${scriptId}`);
    }

    const isTalkingPhoto = options?.isTalkingPhoto || false;
    const avatarType = options?.avatarType || 'regular';
    const videoInputs = this.buildVideoInputs(script, avatarId, voiceId, isTalkingPhoto, avatarType);

    // Build request with optional background music
    // Use 720p resolution (safe for all HeyGen plans)
    const request: any = {
      video_inputs: videoInputs,
      dimension: {
        width: 1280,
        height: 720,
      },
      test: options?.test || false,
    };

    // Add background music if specified (subtle volume for speech clarity)
    const musicChoice = options?.backgroundMusic || 'corporate';
    if (musicChoice !== 'none') {
      const musicUrl = BACKGROUND_MUSIC_URLS[musicChoice];
      if (musicUrl) {
        request.audio_setting = {
          audio_url: musicUrl,
          audio_volume: 0.15,  // Low volume so avatar speech is clear
        };
      }
    }

    console.log(`Creating video with ${videoInputs.length} scenes, music: ${musicChoice}`);

    const response = await fetch(`${HEYGEN_API_URL}/v2/video/generate`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create video: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data?.video_id;
  }

  async createSimpleVideo(
    scriptText: string,
    avatarId: string,
    voiceId: string,
    options?: {
      aspectRatio?: string;
      test?: boolean;
    }
  ): Promise<string> {
    const request: CreateVideoRequest = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            voice_id: voiceId,
            input_text: scriptText,
          },
          background: {
            type: "color",
            value: "#1a365d",
          },
        },
      ],
      dimension: {
        width: 1280,
        height: 720,
      },
      test: options?.test || false,
    };

    const response = await fetch(`${HEYGEN_API_URL}/v2/video/generate`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create video: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data?.video_id;
  }

  async getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
    const response = await fetch(`${HEYGEN_API_URL}/v1/video_status.get?video_id=${videoId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const text = await response.text();
    
    // Check if response is HTML (error page) instead of JSON
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error('HeyGen returned HTML instead of JSON. Response:', text.substring(0, 200));
      throw new Error('HeyGen API returned an error page. Please try again.');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse HeyGen response:', text.substring(0, 200));
      throw new Error('Invalid response from HeyGen API');
    }

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${data.error?.message || data.message || response.statusText}`);
    }

    return data.data;
  }

  async waitForVideoCompletion(videoId: string, maxAttempts: number = 120): Promise<HeyGenVideoStatus> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoStatus(videoId);
      
      if (status.status === "completed" || status.status === "failed") {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error("Video generation timed out");
  }

  async uploadAsset(imageUrl: string): Promise<string> {
    const response = await fetch(`${HEYGEN_API_URL}/v1/asset`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        url: imageUrl,
        type: "image"
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to upload asset: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data?.asset_id;
  }

  async createPhotoAvatarGroup(name: string): Promise<{ groupId: string }> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/photo_avatar/avatar_group/create`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create avatar group: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { groupId: data.data?.id };
  }

  async addLookToAvatarGroup(groupId: string, imageUrl: string, name: string): Promise<{ avatarId: string }> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/photo_avatar/avatar_group/add_looks`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        id: groupId,
        looks: [{
          name: name,
          image_url: imageUrl,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to add look to avatar: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { avatarId: data.data?.avatar_id || groupId };
  }

  async generateAIAvatarPhoto(options: {
    name: string;
    age: string;
    gender: string;
    ethnicity: string;
    appearance?: string;
  }): Promise<{ imageUrl: string; avatarId: string }> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/photo_avatar/photo/generate`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: options.name,
        age: options.age,
        gender: options.gender,
        ethnicity: options.ethnicity,
        orientation: "square",
        pose: "half_body",
        style: "Realistic",
        appearance: options.appearance || "Professional business attire, confident expression, neutral background",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to generate AI avatar photo: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      imageUrl: data.data?.image_url,
      avatarId: data.data?.avatar_id,
    };
  }

  async createTalkingPhoto(imageUrl: string, name: string): Promise<{ talkingPhotoId: string }> {
    // First, download the image from the URL
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    
    console.log(`Image downloaded, size: ${imageBuffer.byteLength} bytes, type: ${contentType}`);
    
    // Upload the binary image data to HeyGen
    const response = await fetch(`${HEYGEN_UPLOAD_URL}/v1/talking_photo`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.getApiKey(),
        "Content-Type": contentType.includes("png") ? "image/png" : "image/jpeg",
      },
      body: Buffer.from(imageBuffer),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = JSON.parse(text);
        errorMessage = error.message || error.error || JSON.stringify(error);
      } catch {
        errorMessage = text.slice(0, 200);
      }
      console.error(`HeyGen API error: ${errorMessage}`);
      throw new Error(`Failed to create talking photo: ${errorMessage}`);
    }

    const data = await response.json();
    console.log(`Talking photo created with ID: ${data.data?.talking_photo_id}`);
    return { talkingPhotoId: data.data?.talking_photo_id };
  }

  async listTalkingPhotos(): Promise<any[]> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/talking_photo`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list talking photos: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data?.talking_photos || [];
  }

  getScripts(): VideoScript[] {
    return videoScripts;
  }

  getScriptById(id: string): VideoScript | undefined {
    return videoScripts.find(s => s.id === id);
  }

  getScriptsByAudience(audience: string): VideoScript[] {
    return videoScripts.filter(s => s.targetAudience === audience);
  }

  isConfigured(): boolean {
    return !!process.env.HEYGEN_API_KEY;
  }
}

export const heygenService = new HeyGenService();
