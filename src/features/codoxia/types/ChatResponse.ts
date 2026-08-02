export type ChatResponse = {
  success: boolean;
  message: string;
  data: {
    uid: string;
    question: string;
    answer: string;
  };
};
