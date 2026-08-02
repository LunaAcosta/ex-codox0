import { ApiChatRepository } from "../../infrastructure/api/ApiChatRepository";

const chatRepository = new ApiChatRepository();

export const processFinancialQuestion = async (
  uid: string,
  question: string,
): Promise<string> => {
  if (!uid) {
    throw new Error("Debes iniciar sesión para utilizar el asistente financiero.");
  }

  const response = await chatRepository.sendMessage({
    uid,
    question: question.trim(),
  });

  return response.data.answer;
};
