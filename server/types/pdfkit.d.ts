declare module "pdfkit" {
  const PDFDocument: any;
  export default PDFDocument;
  export = PDFDocument;
}

declare namespace PDFKit {
  type PDFDocument = any;
}
