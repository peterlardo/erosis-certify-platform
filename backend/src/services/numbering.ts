import { randomBytes } from 'crypto';
import prisma from '../config/database';

export function generateInternalId(): string {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function generatePublicNumber(trainingCenterId: string, courseCode?: string): Promise<string> {
  const center = await prisma.trainingCenter.findUnique({ where: { id: trainingCenterId } });
  const prefix = center?.slug ? center.slug.toUpperCase().replace(/-/g, '') : 'EROSIS';

  const year = new Date().getFullYear();

  const count = await prisma.certificate.count({
    where: { trainingCenterId },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const coursePart = courseCode ? `-${courseCode}` : '';
  return `${prefix}-${year}${coursePart}-${sequence}`;
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function ensureUniqueShortCode(): Promise<string> {
  let shortCode: string;
  let exists = true;
  do {
    shortCode = generateShortCode();
    const existing = await prisma.certificate.findUnique({ where: { shortCode } });
    exists = !!existing;
  } while (exists);
  return shortCode;
}

export async function ensureUniquePublicNumber(trainingCenterId: string, courseCode?: string): Promise<string> {
  let publicNumber: string;
  let exists = true;
  do {
    publicNumber = await generatePublicNumber(trainingCenterId, courseCode);
    const existing = await prisma.certificate.findUnique({ where: { publicNumber } });
    exists = !!existing;
  } while (exists);
  return publicNumber;
}

export async function ensureUniqueInternalId(): Promise<string> {
  let internalId: string;
  let exists = true;
  do {
    internalId = generateInternalId();
    const existing = await prisma.certificate.findUnique({ where: { internalId } });
    exists = !!existing;
  } while (exists);
  return internalId;
}
