import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const streamChat = async function* (
  message: string,
  history: { role: string; parts: { text: string }[] }[]
) {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: 'You are a helpful and knowledgeable AI assistant.',
    }
  });

  const responseStream = await chat.sendMessageStream({ message });
  
  for await (const chunk of responseStream) {
    const c = chunk as GenerateContentResponse;
    if (c.text) {
      yield c.text;
    }
  }
};

export const analyzeImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const ai = getAiClient();
  
  // Extract just the base64 data, removing the header "data:image/png;base64,"
  const base64Data = base64Image.split(',')[1];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt || "Describe this image in detail.",
        },
      ],
    },
  });

  return response.text || "No response generated.";
};
