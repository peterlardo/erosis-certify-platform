import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

// GET /api/public/verify/:identifier
router.get('/verify/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { publicNumber: identifier },
          { shortCode: identifier },
          { internalId: identifier },
        ],
      },
      include: {
        learner: {
          select: { firstName: true, lastName: true, matricule: true, civility: true },
        },
        course: {
          select: { title: true, code: true, duration: true, durationUnit: true },
        },
        session: {
          select: { reference: true, startDate: true, endDate: true },
        },
        trainingCenter: {
          select: { name: true, slug: true, logo: true, slogan: true, primaryColor: true },
        },
      },
    });

    if (!certificate) {
      res.status(404).json({ success: false, error: 'Certificate not found', data: { valid: false } });
      return;
    }

    const isValid = !['REVOKED', 'SUSPENDED', 'EXPIRED', 'REPLACED', 'ARCHIVED'].includes(certificate.status);

    const issuedDate = certificate.issuedAt
      ? certificate.issuedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    const startDate = certificate.startDate
      ? certificate.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    const endDate = certificate.endDate
      ? certificate.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    const expiresDate = certificate.expiresAt
      ? certificate.expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    res.json({
      success: true,
      data: {
        valid: isValid,
        status: certificate.status,
        publicNumber: certificate.publicNumber,
        shortCode: certificate.shortCode,
        learner: certificate.learner,
        course: certificate.course,
        session: certificate.session,
        trainingCenter: certificate.trainingCenter,
        issuedDate,
        startDate,
        endDate,
        expiresAt: expiresDate,
        result: certificate.result,
        mention: certificate.mention,
        revocationReason: certificate.revocationReason,
        revocationDate: certificate.revocationDate,
        cryptographicFingerprint: certificate.cryptographicFingerprint,
        verificationUrl: certificate.verificationUrl,
      },
    });
  } catch (error) {
    console.error('Public verify error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/public/verify-qr
router.post('/verify-qr', async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      res.status(400).json({ success: false, error: 'qrData is required' });
      return;
    }

    const urlParts = qrData.split('/');
    const identifier = urlParts[urlParts.length - 1];

    if (!identifier) {
      res.status(400).json({ success: false, error: 'Invalid QR data' });
      return;
    }

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { publicNumber: identifier },
          { shortCode: identifier },
          { internalId: identifier },
        ],
      },
      include: {
        learner: {
          select: { firstName: true, lastName: true, matricule: true, civility: true },
        },
        course: {
          select: { title: true, code: true },
        },
        session: {
          select: { reference: true, startDate: true, endDate: true },
        },
        trainingCenter: {
          select: { name: true, slug: true, logo: true },
        },
      },
    });

    if (!certificate) {
      res.status(404).json({ success: false, error: 'Certificate not found', data: { valid: false } });
      return;
    }

    const isValid = !['REVOKED', 'SUSPENDED', 'EXPIRED', 'REPLACED', 'ARCHIVED'].includes(certificate.status);

    res.json({
      success: true,
      data: {
        valid: isValid,
        status: certificate.status,
        publicNumber: certificate.publicNumber,
        shortCode: certificate.shortCode,
        learner: certificate.learner,
        course: certificate.course,
        session: certificate.session,
        trainingCenter: certificate.trainingCenter,
        issuedAt: certificate.issuedAt,
        result: certificate.result,
        mention: certificate.mention,
        revocationReason: certificate.revocationReason,
      },
    });
  } catch (error) {
    console.error('QR verify error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/public/demo-certificate
router.get('/demo-certificate', async (_req: Request, res: Response) => {
  try {
    const { generateDemoCertificate } = await import('../services/pdf-generator');
    const pdfBuffer = await generateDemoCertificate();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="demo-certificate.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Demo certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
