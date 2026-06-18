import { OpenAI } from 'openai';
import { TransactionType, WalletType } from "../types";


export type FinancialContext = {
  transactions: TransactionType[];
  wallets: WalletType[];
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  expensesByCategory: { [key: string]: number };
};

// Initialize OpenAI client
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const openaiClient = new OpenAI({ apiKey });
const SYSTEM_PROMPT = `Eres el asistente financiero oficial de Ex-Codox, especializado exclusivamente en finanzas personales y en el análisis de los datos financieros del usuario.

OBJETIVO:
Ayudar al usuario a comprender y mejorar su situación financiera mediante el análisis de gastos, ingresos, presupuestos, ahorro y hábitos de consumo.

REGLAS ESTRICTAS DE COMPORTAMIENTO

1. TEMAS PERMITIDOS
   Solo puedes responder consultas relacionadas con:

* Gastos y análisis de gastos
* Ingresos y análisis de ingresos
* Presupuestos
* Ahorro y estrategias de ahorro
* Flujo de efectivo
* Categorías financieras
* Tendencias financieras
* Hábitos de consumo
* Metas financieras
* Recomendaciones de ahorro
* Comparaciones financieras
* Resúmenes financieros
* Educación financiera básica relacionada con finanzas personales

2. SALUDOS Y MENSAJES GENERALES

Si el usuario envía únicamente un saludo o mensaje social como:

* Hola
* Buenos días
* Buenas tardes
* Buenas noches
* ¿Cómo estás?
* ¿Qué puedes hacer?
* Necesito ayuda
* Ayúdame
* Gracias

Responde de forma cordial y redirige la conversación hacia temas financieros.

Ejemplos:

Usuario: "Hola"
Respuesta:
"Hola. Estoy aquí para ayudarte con tus finanzas personales. Puedes consultarme sobre gastos, ingresos, presupuestos, ahorro o hábitos financieros."

Usuario: "Necesito ayuda"
Respuesta:
"Con gusto. Puedo ayudarte a analizar tus gastos, ingresos, presupuestos y oportunidades de ahorro. ¿Sobre qué aspecto financiero necesitas ayuda?"

3. TEMAS NO PERMITIDOS

No respondas preguntas relacionadas con:

* Programación o desarrollo de software
* Deportes
* Política
* Medicina o salud
* Historia
* Entretenimiento
* Películas
* Cultura general
* Noticias
* Tecnología no relacionada con finanzas
* Matemáticas sin contexto financiero

4. RESPUESTA OBLIGATORIA PARA TEMAS FUERA DEL ÁMBITO FINANCIERO

Si el usuario solicita información fuera de las finanzas personales, responde EXACTAMENTE:

"Soy un asistente especializado en finanzas personales dentro de Ex-Codox. Solo puedo ayudarte con consultas relacionadas con ingresos, gastos, presupuestos, ahorro y hábitos financieros."

5. REGLAS SOBRE DATOS

* Utiliza únicamente la información financiera disponible.
* No inventes ingresos, gastos ni estadísticas.
* No supongas información faltante.
* No realices cálculos si faltan datos necesarios.

Si no existe información suficiente, responde:

"No dispongo de información suficiente para responder esa consulta con los datos financieros actuales."

6. ANÁLISIS Y RECOMENDACIONES

Cuando existan datos suficientes:

* Identifica patrones de gasto.
* Detecta categorías con mayor impacto financiero.
* Señala posibles oportunidades de ahorro.
* Explica tendencias observadas.
* Ofrece recomendaciones prácticas y realistas.
* Prioriza acciones concretas y fáciles de implementar.

7. ESTILO DE RESPUESTA

* Sé amable y profesional.
* Mantén respuestas claras y directas.
* Evita explicaciones innecesariamente largas.
* Mantén siempre el foco en las finanzas personales.
* Nunca cambies de tema hacia áreas no financieras.

8. SI TIENES DUDAS SOBRE SI UNA PREGUNTA ES FINANCIERA

Asume una postura conservadora:

* Si está relacionada con dinero, gastos, ingresos, ahorro, inversiones personales o presupuestos, responde.
* Si no tiene una relación clara con finanzas personales, utiliza la respuesta de restricción definida anteriormente.

DATOS FINANCIEROS DEL USUARIO:
{{FINANCIAL_DATA}}


Responde siempre en español.`;

const INSUFFICIENT_DATA_RESPONSE = "No dispongo de información suficiente para responder esa consulta con los datos financieros actuales.";

export const buildFinancialContext = (
  transactions: TransactionType[],
  wallets: WalletType[]
): FinancialContext => {
  let totalIncome = 0;
  let totalExpenses = 0;
  const expensesByCategory: { [key: string]: number } = {};

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount || 0;
    } else if (transaction.type === "expense") {
      totalExpenses += transaction.amount || 0;
      const category = transaction.category || "Sin categoría";
      expensesByCategory[category] =
        (expensesByCategory[category] || 0) + (transaction.amount || 0);
    }
  });

  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + (wallet.amount || 0),
    0
  );

  return {
    transactions,
    wallets,
    totalIncome,
    totalExpenses,
    totalBalance,
    expensesByCategory,
  };
};

const formatFinancialDataForPrompt = (context: FinancialContext): string => {
  let data = "INFORMACIÓN FINANCIERA DEL USUARIO:\n\n";

  data += "RESUMEN GENERAL:\n";
  data += `- Ingresos totales: $${context.totalIncome.toFixed(2)}\n`;
  data += `- Gastos totales: $${context.totalExpenses.toFixed(2)}\n`;
  data += `- Diferencia (Ingresos - Gastos): $${(context.totalIncome - context.totalExpenses).toFixed(2)}\n`;
  data += `- Balance total en billeteras: $${context.totalBalance.toFixed(2)}\n`;

  if (context.transactions.length > 0) {
    data += `- Total de transacciones: ${context.transactions.length}\n`;
  }

  if (Object.keys(context.expensesByCategory).length > 0) {
    data += "\nGASTOS POR CATEGORÍA:\n";
    const sortedCategories = Object.entries(context.expensesByCategory)
      .sort(([, a], [, b]) => b - a);
    sortedCategories.forEach(([category, amount]) => {
      const percentage = ((amount / context.totalExpenses) * 100).toFixed(1);
      data += `- ${category}: $${amount.toFixed(2)} (${percentage}%)\n`;
    });
  }

  if (context.wallets.length > 0) {
    data += "\nBILLETERAS:\n";
    context.wallets.forEach((wallet) => {
      data += `- ${wallet.name}: $${wallet.amount?.toFixed(2)}\n`;
    });
  }

  if (context.transactions.length > 0) {
    data += "\nÚLTIMAS TRANSACCIONES (últimas 10):\n";
    const lastTransactions = context.transactions.slice(0, 10);
    lastTransactions.forEach((t, idx) => {
      const type = t.type === "income" ? "Ingreso" : "Gasto";
      const category = t.category ? ` (${t.category})` : "";
      data += `${idx + 1}. ${type}${category}: $${t.amount}\n`;
    });
  }

  return data;
};

export const processFinancialQuestionWithOpenAI = async (
  question: string,
  context: FinancialContext
): Promise<string> => {
  try {
    // Check if we have sufficient financial data
    if (context.transactions.length === 0 && context.wallets.length === 0) {
      return "No hay datos financieros disponibles. Por favor, registra al menos una transacción o cartera para que pueda ayudarte.";
    }

    // Format financial data for the prompt
    const financialData = formatFinancialDataForPrompt(context);

    // Replace placeholder in system prompt
    const finalSystemPrompt = SYSTEM_PROMPT.replace(
      "{{FINANCIAL_DATA}}",
      financialData
    );

    // Call OpenAI API
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: finalSystemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract the response
    const assistantResponse =
      response.choices[0].message.content ||
      "No pude procesar tu pregunta. Intenta nuevamente.";

    return assistantResponse;
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);

    // Fallback for API errors
    if (error.status === 429) {
      return "Estoy procesando muchas solicitudes. Por favor, intenta nuevamente en unos momentos.";
    }
    if (error.status === 401) {
      return "Hay un problema con la configuración del servicio. Por favor, contacta al administrador.";
    }

    return "No pude conectarme al servicio de IA. Por favor, verifica tu conexión a internet e intenta nuevamente.";
  }
};
