export type UserRole = 'guest' | 'contributor' | 'expert' | 'admin';
export type PracticeStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  bio?: string | null;
  state?: string | null;
  badges?: string[] | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  practice_count?: number;
}

export interface Practice {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  state: string;
  district: string;
  village: string;
  benefits: string;
  modern_adaptation: string;
  status: PracticeStatus;
  contributor_id: string;
  contributor_name?: string;
  images: string[];
  audio_url?: string | null;
  pdf_url?: string | null;
  transcript?: string | null;
  ai_summary?: string | null;
  ai_keywords?: string[] | null;
  likes_count: number;
  comments_count?: number;
  views_count: number;
  featured: boolean;
  expert_comments?: string | null;
  validated_by?: string | null;
  created_at: string;
  updated_at?: string;
  liked?: boolean;
  bookmarked?: boolean;
}

export interface Comment {
  id: number;
  practice_id: number;
  user_id: string;
  user_name?: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string | null;
  created_at: string;
}

export interface ValidationLog {
  id: number;
  practice_id: number;
  expert_id: string;
  expert_name?: string;
  action: string;
  comments: string;
  previous_status: string;
  new_status: string;
  created_at: string;
}

export interface AnalyticsData {
  total_practices: number;
  pending: number;
  approved: number;
  rejected: number;
  active_contributors: number;
  total_experts: number;
  total_users: number;
  state_distribution: { state: string; count: number }[];
  category_distribution: { category: string; count: number }[];
  monthly_uploads: { month: string; count: number }[];
  expert_stats: { expert: string; approved: number; rejected: number }[];
}

export interface PublicStats {
  contributors: number;
  practices: number;
  experts: number;
  states: number;
}
