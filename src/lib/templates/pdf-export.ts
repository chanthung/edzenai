import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportNodeToPdf(
  node: HTMLElement,
  filename: string,
  paperSize: 'A4' | 'A5' | 'Letter' = 'A4',
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize.toLowerCase() as any,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
  pdf.save(filename);
}

export async function exportNodesToPdf(
  nodes: HTMLElement[],
  filename: string,
  paperSize: 'A4' | 'A5' | 'Letter' = 'A4',
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  if (nodes.length === 0) return;
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize.toLowerCase() as any,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < nodes.length; i++) {
    const canvas = await html2canvas(nodes[i], {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
  }
  pdf.save(filename);
}
