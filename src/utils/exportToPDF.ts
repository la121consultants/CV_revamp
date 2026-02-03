import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export const exportToPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found for PDF export.");
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(imgData);
  const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);

  if (imgHeight > pageHeight) {
    let remainingHeight = imgHeight - pageHeight;
    while (remainingHeight > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      remainingHeight -= pageHeight;
    }
  }

  pdf.save("cv.pdf");
};
