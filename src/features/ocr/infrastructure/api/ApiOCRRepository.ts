import { apiClient } from '@/core/network/apiClient';
import { Platform } from 'react-native';

import { OCRFile } from '../../types/OCRRequest';
import { OCRResponse } from '../../types/OCRResponse';

const getMimeType = (file: OCRFile) => file.mimeType || file.type || 'image/jpeg';

const getFileName = (file: OCRFile, mimeType: string) => {
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  return file.fileName || file.name || `recibo.${extension}`;
};

export class ApiOCRRepository {
  async extract(file: OCRFile): Promise<OCRResponse> {
    const mimeType = getMimeType(file);
    const fileName = getFileName(file, mimeType);
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(file.uri);
      if (!response.ok) {
        throw new Error('No se pudo acceder a la imagen seleccionada.');
      }
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append(
        'file',
        {
          uri: file.uri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob,
      );
    }

    return apiClient.postForm<OCRResponse>('/ai/ocr', formData);
  }
}
