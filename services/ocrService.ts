import * as FileSystem from 'expo-file-system/legacy';
import OpenAI from 'openai';
import { expenseCategories } from '../src/constants/data';
import { ResponseType } from '../types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export type OcrExtractedData = {
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
  rawText?: string;
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  
  supermercado: 'supermarket',
  mercadona: 'supermarket',
  perlitas: 'supermarket',
  galones: 'supermarket',
  oxxo: 'supermarket',
  comida: 'dining',
  restaurante: 'dining',
  delivery: 'dining',
  renta: 'rent',
  alquiler: 'rent',
  luz: 'services',
  agua: 'services',
  gas: 'services',
  internet: 'services',
  telefonia: 'services',
  transporte: 'transportation',
  gasolina: 'transportation',
  taxi: 'transportation',
  uber: 'transportation',
  salud: 'health',
  farmacia: 'health',
  medicina: 'health',
  seguro: 'insurance',
  ropa: 'clothing',
  vestimenta: 'clothing',
  educación: 'education',
  educacion: 'education',
  escuela: 'education',
  universidad: 'education',
  entretenimiento: 'entretenmet',
  cine: 'entretenmet',
  ocio: 'entretenmet',
  personal: 'personal',
  peluqueria: 'personal',
  spa: 'personal',
  ahorro: 'saving',
  inversiones: 'saving',
  ingresos: 'income',
  salario: 'income',
  nómina: 'income',
  nomina: 'income',
  sueldo: 'income',
};

const MONTH_NAMES: Record<string, number> = {
  ene: 1,
  enero: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  ago: 8,
  agosto: 8,
  sep: 9,
  septiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dic: 12,
  diciembre: 12,
};

const parseDateFromText = (text: string) => {
  const normalized = text.toLowerCase();
  const patterns = [
    /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/,
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/,
    /\b(\d{1,2})\s+(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\w*\s+(\d{4})\b/,
    /\b(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\w*\s+(\d{1,2}),?\s*(\d{4})\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    if (pattern === patterns[0]) {
      const [, year, month, day] = match;
      return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (pattern === patterns[1]) {
      const [, first, second, third] = match;
      const year = third.length === 2 ? `20${third}` : third;
      return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
    }

    if (pattern === patterns[2]) {
      const [, day, monthName, year] = match;
      const month = MONTH_NAMES[monthName.slice(0, 3)];
      if (month) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    if (pattern === patterns[3]) {
      const [, monthName, day, year] = match;
      const month = MONTH_NAMES[monthName.slice(0, 3)];
      if (month) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  return undefined;
};

const normalizeCategory = (text: string, suggestedCategory?: string) => {
  const normalized = text.toLowerCase();
  const categoryMap = Object.values(expenseCategories).map((item) => ({
    value: item.value,
    label: item.label.toLowerCase(),
  }));

  if (suggestedCategory) {
    const normalizedSuggested = suggestedCategory.toLowerCase().trim();
    const labelMatch = categoryMap.find((item) => item.label === normalizedSuggested);
    if (labelMatch) return labelMatch.value;

    if (Object.keys(expenseCategories).includes(normalizedSuggested)) {
      return normalizedSuggested;
    }

    if (CATEGORY_KEYWORDS[normalizedSuggested]) {
      return CATEGORY_KEYWORDS[normalizedSuggested];
    }
  }

  const matched = categoryMap.find((item) => normalized.includes(item.label));
  if (matched) return matched.value;

  const fallback = Object.keys(CATEGORY_KEYWORDS).find((word) => normalized.includes(word));
  return fallback ? CATEGORY_KEYWORDS[fallback] : 'others';
};

const readFileAsBase64 = async (uri: string, mimeType: string) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('No se pudo acceder al archivo seleccionado.');
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(new Error('No se pudo convertir el archivo a base64.'));
      reader.readAsDataURL(blob);
    });
  }
};

const fallbackExtract = (text: string): OcrExtractedData => {
  const amountMatch = text.match(/\b(?:total|importe|monto|amount|subtotal|total a pagar)\b[^\d\n]{0,20}([\d]+(?:[.,]\d{1,2})?)/i)
    || text.match(/\b([\d]+(?:[.,]\d{1,2}))\b(?!\d)/g);
  const date = parseDateFromText(text);
  const amount = amountMatch?.[1]
    ? Number(String(amountMatch[1]).replace(',', '.'))
    : amountMatch && amountMatch.length > 1
      ? Number(String(amountMatch[1]).replace(',', '.'))
      : undefined;

  return {
    amount: Number.isFinite(amount) ? amount : undefined,
    date: date || undefined,
    description: text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 4 && !/^(total|importe|monto|fecha|numero|ruc|iva|subtotal|neto)/i.test(line)) || 'Documento escaneado',
    category: normalizeCategory(text),
    rawText: text,
  };
};

export const extractDocumentData = async (file: any): Promise<ResponseType> => {
  try {
    if (!file?.uri) {
      return { success: false, msg: 'No se encontró ningún archivo para analizar.' };
    }

    const mimeType = file.mimeType || (file.type || 'image/jpeg');

    const base64 = await readFileAsBase64(file.uri, mimeType);

    const dataUrl = `data:${mimeType};base64,${base64}`;

    if (!OPENAI_API_KEY) {
      const fallback = fallbackExtract(`Documento: ${file.name || 'sin nombre'}\nTipo: ${mimeType}`);
      return { success: true, data: fallback };
    }

    const content: any[] = [
      {
        type: 'input_text',
        text: 'Extrae el monto, fecha, descripción y categoría del documento. Si el documento es un ingreso, devuelve category como income. Si es un gasto, devuelve category como uno de los valores exactos: groceries, rent, services, transportation, entertainmet, dining, health, insurance, saving, clothing, personal, education, others. Responde solo con JSON válido usando estas claves: amount, date, description, category.',
      },
    ];

    content.push({
      type: 'input_image',
      image_url: dataUrl,
    });

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'Eres un asistente OCR especializado en tickets, facturas y recibos. Devuelve solo JSON válido.',
        },
        {
          role: 'user',
          content,
        },
      ],
      temperature: 0.1,
      max_output_tokens: 500,
    } as any);

    const outputText = String((response as any).output_text || '').trim();
    const jsonStart = outputText.indexOf('{');
    const jsonEnd = outputText.lastIndexOf('}');
    const cleanText = outputText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(cleanText);

    const suggestedCategory = normalizeCategory(String(parsed.category || ''), String(parsed.category || ''));
    const finalCategory = suggestedCategory !== 'others'
      ? suggestedCategory
      : normalizeCategory(String(parsed.description || ''), String(parsed.category || ''));

    return {
      success: true,
      data: {
        amount: parsed.amount ? Number(parsed.amount) : undefined,
        date: parseDateFromText(String(parsed.date || parsed.description || '')) || parsed.date || undefined,
        description: parsed.description || 'Documento escaneado',
        category: finalCategory,
        rawText: outputText,
      },
    };
  } catch (error: any) {
    console.log('OCR error', error);
    return {
      success: false,
      msg: error?.message || 'No se pudo analizar el documento. Intenta nuevamente.',
    };
  }
};
