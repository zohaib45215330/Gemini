export enum AppTab {
  CHAT = 'CHAT',
  VISION = 'VISION',
  LIVE = 'LIVE'
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  image?: string; // base64 data url
  isStreaming?: boolean;
}

export interface VisionState {
  image: string | null;
  mimeType: string | null;
}
