import { ChatRequest } from "../../types/ChatRequest";
import { ChatResponse } from "../../types/ChatResponse";

export interface IChatRepository {
  sendMessage(request: ChatRequest): Promise<ChatResponse>;
}
