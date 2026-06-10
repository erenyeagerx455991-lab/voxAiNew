export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  credits: number;
  subscription_plan: 'free' | 'pro' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface TtsHistory {
  id: string;
  user_id: string;
  text: string;
  voice_name: string;
  audio_url: string;
  duration_seconds: number;
  created_at: string;
}

export interface VoiceModel {
  id: string;
  user_id: string;
  voice_name: string;
  description: string;
  sample_audio_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: 'free' | 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  credits_per_month: number;
  renewal_date: string;
  created_at: string;
}

export interface CreditUsage {
  id: string;
  user_id: string;
  feature_used: 'chat' | 'tts' | 'voice_clone';
  credits_used: number;
  reference_id: string | null;
  created_at: string;
}

export type View = 'chat' | 'projects' | 'admin' | 'builder';

export interface AuthState {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
