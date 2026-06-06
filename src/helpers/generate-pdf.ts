import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera un PDF a partir de un elemento del DOM.
 *
 * Robustez:
 *  - useCORS + crossOrigin en el clon: evita el "tainted canvas" con imágenes
 *    de Cloudinary (causa típica de que la descarga del reporte falle).
 *  - imageTimeout: no se cuelga si una imagen no carga.
 *  - Mensajes de error claros para que el usuario sepa qué pasó.
 */
export const generatePDF = async (element: HTMLElement, filename: string): Promise<void> => {
  if (!element || element.scrollWidth === 0 || element.scrollHeight === 0) {
    throw new Error('No hay contenido visible para exportar.');
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Forzar carga con CORS en todas las imágenes del clon para evitar
        // que el canvas quede "tainted" al reusar imágenes cacheadas sin CORS.
        clonedDoc.querySelectorAll('img').forEach((img) => {
          img.crossOrigin = 'anonymous';
        });
      },
    });
  } catch {
    throw new Error(
      'No se pudieron procesar las imágenes del reporte. Verifica tu conexión e inténtalo de nuevo.'
    );
  }

  let imgData: string;
  try {
    imgData = canvas.toDataURL('image/png');
  } catch {
    // SecurityError: el canvas quedó "tainted" por una imagen sin CORS.
    throw new Error(
      'Una imagen de evidencia bloqueó la generación del PDF (restricción de seguridad). ' +
        'Intenta de nuevo; si persiste, vuelve a subir esa imagen.'
    );
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
};
