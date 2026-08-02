import { apiClient } from "@/core/network/apiClient";

import { IChatRepository } from "../../domain/repositories/IChatRepository";
import { ChatRequest } from "../../types/ChatRequest";
import { ChatResponse } from "../../types/ChatResponse";

export class ApiChatRepository implements IChatRepository {
  sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post<ChatResponse, ChatRequest>("/ai/chat", request);
  }
}
