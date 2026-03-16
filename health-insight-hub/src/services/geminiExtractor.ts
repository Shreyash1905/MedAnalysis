import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

export async function extractMedicalData(text: string | null, base64Image?: string, mimeType?: string) {
  const prompt = `
You are a medical report analyzer.

Convert the following medical report into structured JSON.

Extract:

Patient Name
Age
Gender
Hospital
Test Results

Return JSON format:

{
 "patient":{
   "name":"",
   "age":"",
   "gender":"",
   "hospital":""
 },
 "tests":[
   {
     "test":"",
     "value":"",
     "unit":""
   }
 ]
}

${text ? `Medical Report:\n${text}` : ""}
`;

  let payload = [];
  if (base64Image && mimeType) {
    payload.push({ inlineData: { data: base64Image, mimeType: mimeType } });
  }
  payload.push({ text: prompt });

  const result = await model.generateContent(payload);
  const response = await result.response;
  return response.text();
}
