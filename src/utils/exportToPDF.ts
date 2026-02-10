import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export const exportToPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found for PDF export.");
  }

  // Clone the element so we can render at full A4 size without the preview scale
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.width = "210mm";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: clone.scrollWidth,
      height: clone.scrollHeight,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm

    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);

    // Handle multi-page if content overflows
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
  } finally {
    document.body.removeChild(clone);
  }
};
