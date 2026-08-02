export type OCRData = {
  amount?: number;
  date?: string;
  description: string;
  category: string;
  rawText?: string;
};

export type OCRResponse = {
  success: boolean;
  message: string;
  data: OCRData;
};
