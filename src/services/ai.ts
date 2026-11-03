import { post } from './backend/http';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SearchFilters {
  city?: string;
  district?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  room_type?: string;
  amenities?: string[];
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  user_role?: 'TENANT' | 'LANDLORD';
  filters?: SearchFilters;
}

export interface MatchedRoom {
  id: string;
  title: string;
  description?: string;
  room_type?: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  area_sqm?: number;
  price?: number;
  deposit?: number;
  electricity_cost?: number;
  water_cost?: number;
  amenities?: string[];
  rules?: string[];
  contact_phone?: string;
  landlord_name?: string;
  available?: boolean;
}

export interface ChatResponse {
  answer: string;
  matched_rooms: MatchedRoom[];
  source_documents: string[];
  suggested_follow_ups: string[];
}

/**
 * Gửi tin nhắn tới Roomix AI RAG Service để tư vấn tìm phòng trọ,
 * giải đáp chính sách cọc, hợp đồng và chi phí điện nước.
 */
export async function sendAiMessage(request: ChatRequest): Promise<ChatResponse> {
  return post<ChatResponse>('/api/ai/chat', request);
}

