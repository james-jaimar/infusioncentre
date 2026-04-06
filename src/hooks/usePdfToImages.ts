import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Hook to convert a PDF file to an array of image data URLs (one per page).
 */
export function usePdfToImages() {
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const convert = useCallback(async (file: File, scale = 2): Promise<string[]> => {
    setConverting(true);
    setProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const images: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        images.push(canvas.toDataURL("image/jpeg", 0.92));
        setProgress(Math.round((i / totalPages) * 100));
      }

      return images;
    } finally {
      setConverting(false);
    }
  }, []);

  return { convert, converting, progress };
}
