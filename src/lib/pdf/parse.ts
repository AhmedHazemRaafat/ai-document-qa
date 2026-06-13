import { PDFParse } from "pdf-parse";

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPage[]> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const pages = result.pages
      .map((page) => ({
        pageNumber: page.num,
        text: page.text.replace(/\s+/g, " ").trim(),
      }))
      .filter((page) => page.text.length > 0);

    if (pages.length === 0) {
      throw new Error("No readable text found in PDF");
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}
