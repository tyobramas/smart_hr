import { extractText, getDocumentProxy } from 'unpdf';

export async function extractTextFromCvFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // If it's a PDF file
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const pdf = await getDocumentProxy(buffer);
      const { text } = await extractText(pdf, { mergePages: true });
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }

    // Fallback for text files
    return Buffer.from(arrayBuffer).toString('utf-8').trim();
  } catch (error) {
    console.error('Error extracting text from CV file:', error);
    return '';
  }
}
