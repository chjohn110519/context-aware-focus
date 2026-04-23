import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF.js worker 설정 — Vite 번들링 방식
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * PDF File → 전체 텍스트 추출
 * @param file 업로드된 PDF 파일
 * @returns 페이지별로 합쳐진 전체 텍스트
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    if (pageText.trim()) {
      textParts.push(`[Page ${pageNum}]\n${pageText}`);
    }
  }

  return textParts.join('\n\n');
}

/**
 * 여러 PDF 파일에서 텍스트 추출
 */
export async function extractTextsFromPdfs(
  files: File[]
): Promise<{ filename: string; text: string }[]> {
  const results = [];
  for (const file of files) {
    const text = await extractTextFromPdf(file);
    results.push({ filename: file.name, text });
  }
  return results;
}
