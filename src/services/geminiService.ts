import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const extractProfileFromResume = async (fileBase64: string, mimeType: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Extract the following information from this resume in JSON format:
            - name: Full name
            - tagline: A short professional tagline (e.g., "Full Stack Developer")
            - intro: A professional summary or introduction (about 2-3 sentences)
            - skills: A list of technical skills (as an array of strings)
            - education: A list of education entries, each with:
              - degree: The degree earned
              - institution: The school or university name
              - year: The year or date range
            - githubUrl: GitHub profile URL if found
            - linkedinUrl: LinkedIn profile URL if found
            
            Return ONLY the JSON object.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          tagline: { type: Type.STRING },
          intro: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                institution: { type: Type.STRING },
                year: { type: Type.STRING },
              },
              required: ["degree", "institution"],
            },
          },
          githubUrl: { type: Type.STRING },
          linkedinUrl: { type: Type.STRING },
        },
        required: ["name", "tagline", "intro", "skills", "education"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return null;
  }
};
