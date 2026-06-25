import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from the PDF. Please ensure the file is a valid PDF.');
  }
}

export function extractFundMetadata(text: string): {
  fundName: string | null;
  amc: string | null;
  period: string | null;
} {
  const fundNameMatch = text.match(/(?:fund name|scheme name)[\s:]*([^\n.]{5,80})/i);
  const amcMatch = text.match(/(?:AMC|Asset Management|Mutual Fund)[\s:]*([^\n.]{3,60})/i);
  const periodMatch = text.match(/(?:For the (?:quarter|month|period) (?:ended|of)|Report for)[\s:]*([^\n.]{5,40})/i);
  return {
    fundName: fundNameMatch ? fundNameMatch[1].trim() : null,
    amc: amcMatch ? amcMatch[1].trim() : null,
    period: periodMatch ? periodMatch[1].trim() : null,
  };
}
