export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  pending?: boolean;
  isEdited?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatConversation {
  conversationId: string;
  preview: string;
  createdAt: string;
  updatedAt?: string;
}