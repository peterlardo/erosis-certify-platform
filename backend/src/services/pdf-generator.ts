import PdfPrinter from 'pdfmake';
import QRCode from 'qrcode';
import { createHash } from 'crypto';

interface TextElement {
  type: 'text';
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface ImageElement {
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

interface RectElement {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
}

interface LineElement {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
}

interface QrElement {
  type: 'qrcode';
  content: string;
  x: number;
  y: number;
  size: number;
}

type TemplateElement = TextElement | ImageElement | RectElement | LineElement | QrElement;

interface CertificateData {
  learnerName: string;
  courseName: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  result?: string;
  mention?: string;
  publicNumber: string;
  shortCode: string;
  internalId: string;
  issuedAt: string;
  expiresAt?: string;
  verificationUrl: string;
  cryptographicFingerprint: string;
  qrCodeDataUrl: string;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundImage?: string;
  elements: TemplateElement[];
}

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  Courier: {
    normal: 'Courier',
    bold: 'Courier-Bold',
    italics: 'Courier-Oblique',
    bolditalics: 'Courier-BoldOblique',
  },
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic',
  },
};

export function generateCryptographicFingerprint(data: Record<string, unknown>): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const printer = new PdfPrinter(fonts);

  const isLandscape = data.orientation === 'LANDSCAPE';
  const pageWidth = isLandscape ? data.width : data.height;
  const pageHeight = isLandscape ? data.height : data.width;

  const content: any[] = [];

  if (data.backgroundImage) {
    content.push({
      image: data.backgroundImage,
      width: pageWidth,
      height: pageHeight,
      absolutePosition: { x: 0, y: 0 },
    });
  }

  for (const el of data.elements) {
    switch (el.type) {
      case 'text': {
        const textEl = el as TextElement;
        content.push({
          text: textEl.content,
          fontSize: textEl.fontSize || 12,
          color: textEl.color || '#000000',
          bold: textEl.bold || false,
          italics: textEl.italic || false,
          alignment: textEl.align || 'left',
          absolutePosition: { x: textEl.x, y: textEl.y },
          font: textEl.fontFamily || 'Helvetica',
        });
        break;
      }
      case 'image': {
        const imgEl = el as ImageElement;
        content.push({
          image: imgEl.src,
          width: imgEl.width,
          height: imgEl.height,
          opacity: imgEl.opacity || 1,
          absolutePosition: { x: imgEl.x, y: imgEl.y },
        });
        break;
      }
      case 'qrcode': {
        const qrEl = el as QrElement;
        const qrDataUrl = await QRCode.toDataURL(qrEl.content, {
          width: qrEl.size,
          margin: 0,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        content.push({
          image: qrDataUrl,
          width: qrEl.size,
          height: qrEl.size,
          absolutePosition: { x: qrEl.x, y: qrEl.y },
        });
        break;
      }
      case 'rect': {
        const rectEl = el as RectElement;
        content.push({
          canvas: [
            {
              type: 'rect',
              x: rectEl.x,
              y: rectEl.y,
              w: rectEl.width,
              h: rectEl.height,
              color: rectEl.color || '#000000',
              ...(rectEl.borderColor
                ? { lineColor: rectEl.borderColor, lineWidth: rectEl.borderWidth || 1 }
                : {}),
            },
          ],
        });
        break;
      }
      case 'line': {
        const lineEl = el as LineElement;
        content.push({
          canvas: [
            {
              type: 'line',
              x1: lineEl.x1,
              y1: lineEl.y1,
              x2: lineEl.x2,
              y2: lineEl.y2,
              lineColor: lineEl.color || '#000000',
              lineWidth: lineEl.width || 1,
            },
          ],
        });
        break;
      }
    }
  }

  const docDefinition: any = {
    pageSize: {
      width: pageWidth,
      height: pageHeight,
    },
    pageMargins: [0, 0, 0, 0],
    content: content,
    background: data.backgroundColor
      ? [
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: pageWidth,
                h: pageHeight,
                color: data.backgroundColor,
              },
            ],
          },
        ]
      : undefined,
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

export async function generateDemoCertificate(): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL('https://verify.erosis-conseil.cg/demo', {
    width: 150,
    margin: 1,
  });

  const fingerprint = generateCryptographicFingerprint({
    id: 'demo-001',
    learner: 'Jean Dupont',
    course: 'ISO/IEC 27001 Lead Implementer',
    issuedAt: new Date().toISOString(),
  });

  const data: CertificateData = {
    learnerName: 'Jean Dupont',
    courseName: 'ISO/IEC 27001 Lead Implementer',
    startDate: '01/01/2026',
    endDate: '15/03/2026',
    duration: '75 jours',
    result: '82%',
    mention: 'BIEN',
    publicNumber: 'EROSIS-2026-0001',
    shortCode: 'ABC123',
    internalId: 'INT-001',
    issuedAt: new Date().toLocaleDateString('fr-FR'),
    verificationUrl: 'https://verify.erosis-conseil.cg/ABC123',
    cryptographicFingerprint: fingerprint,
    qrCodeDataUrl: qrDataUrl,
    orientation: 'LANDSCAPE',
    width: 1200,
    height: 850,
    backgroundColor: '#FFFFFF',
    elements: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1200,
        height: 850,
        color: '#F8F9FA',
        borderColor: '#1423A5',
        borderWidth: 8,
      },
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1200,
        height: 180,
        color: '#1423A5',
      },
      {
        type: 'text',
        content: 'EROSIS CONSEIL',
        x: 600,
        y: 30,
        fontSize: 36,
        color: '#FFFFFF',
        bold: true,
        align: 'center',
        fontFamily: 'Helvetica',
      },
      {
        type: 'text',
        content: 'CERTIFICAT DE FORMATION',
        x: 600,
        y: 90,
        fontSize: 28,
        color: '#FFFFFF',
        bold: true,
        align: 'center',
        fontFamily: 'Helvetica',
      },
      {
        type: 'text',
        content: 'Ce certificat est décerné à',
        x: 600,
        y: 240,
        fontSize: 16,
        color: '#666666',
        align: 'center',
      },
      {
        type: 'text',
        content: 'Jean Dupont',
        x: 600,
        y: 280,
        fontSize: 42,
        color: '#1423A5',
        bold: true,
        align: 'center',
      },
      {
        type: 'text',
        content: 'Pour avoir suivi avec succès la formation',
        x: 600,
        y: 350,
        fontSize: 14,
        color: '#666666',
        align: 'center',
      },
      {
        type: 'text',
        content: 'ISO/IEC 27001 Lead Implementer',
        x: 600,
        y: 380,
        fontSize: 22,
        color: '#B0008F',
        bold: true,
        align: 'center',
      },
      {
        type: 'text',
        content: `Durée: 75 jours | Note: 82% | Mention: BIEN`,
        x: 600,
        y: 430,
        fontSize: 13,
        color: '#666666',
        align: 'center',
      },
      {
        type: 'text',
        content: `Délivré le ${new Date().toLocaleDateString('fr-FR')}`,
        x: 600,
        y: 470,
        fontSize: 13,
        color: '#666666',
        align: 'center',
      },
      {
        type: 'text',
        content: `N° ${'EROSIS-2026-0001'}`,
        x: 600,
        y: 510,
        fontSize: 12,
        color: '#999999',
        align: 'center',
      },
      {
        type: 'qrcode',
        content: 'https://verify.erosis-conseil.cg/ABC123',
        x: 525,
        y: 560,
        size: 150,
      },
      {
        type: 'rect',
        x: 0,
        y: 780,
        width: 1200,
        height: 70,
        color: '#1423A5',
      },
      {
        type: 'text',
        content: 'www.erosis-conseil.cg | Brazzaville, Congo',
        x: 600,
        y: 800,
        fontSize: 11,
        color: '#FFFFFF',
        align: 'center',
      },
    ],
  };

  return generateCertificatePDF(data);
}
