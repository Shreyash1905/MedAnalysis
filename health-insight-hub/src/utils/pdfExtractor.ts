import * as pdfjsLib from "pdfjs-dist";

// Provide the worker using a CDN since this is a Vite environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractPDFText(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Create a Uint8Array from the ArrayBuffer as expected by pdf.js
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(" ") + "\\n";
  }
  
  return text;
}
