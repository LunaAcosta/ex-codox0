import { ResponseType } from '../../../../shared/types';
import { ApiOCRRepository } from '../../infrastructure/api/ApiOCRRepository';
import { OCRFile } from '../../types/OCRRequest';
import { OCRData } from '../../types/OCRResponse';

export type OcrExtractedData = OCRData;

const repository = new ApiOCRRepository();

export const extractDocumentData = async (file: OCRFile): Promise<ResponseType> => {
  try {
    if (!file?.uri) {
      return { success: false, msg: 'No se encontró ninguna imagen para analizar.' };
    }

    const response = await repository.extract(file);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      msg: error instanceof Error
        ? error.message
        : 'No se pudo analizar el documento. Intenta nuevamente.',
    };
  }
};
