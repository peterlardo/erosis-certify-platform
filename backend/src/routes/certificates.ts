import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { generateCertificatePDF, generateCryptographicFingerprint, generateDemoCertificate } from '../services/pdf-generator';
import { ensureUniqueInternalId, ensureUniquePublicNumber, ensureUniqueShortCode } from '../services/numbering';

const router = Router();

// GET /api/certificates
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const learnerId = req.query.learnerId as string;
    const courseId = req.query.courseId as string;
    const sessionId = req.query.sessionId as string;
    const trainingCenterId = req.query.trainingCenterId as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) where.status = status;
    if (learnerId) where.learnerId = learnerId;
    if (courseId) where.courseId = courseId;
    if (sessionId) where.sessionId = sessionId;
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;
    if (search) {
      where.OR = [
        { publicNumber: { contains: search } },
        { shortCode: { contains: search } },
        { internalId: { contains: search } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          learner: { select: { id: true, firstName: true, lastName: true, matricule: true } },
          course: { select: { id: true, code: true, title: true } },
          session: { select: { id: true, reference: true } },
          template: { select: { id: true, name: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        certificates,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List certificates error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/generate
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId, courseId, sessionId, templateId, trainingCenterId } = req.body;
    if (!learnerId || !courseId || !trainingCenterId) {
      res.status(400).json({ success: false, error: 'learnerId, courseId, and trainingCenterId are required' });
      return;
    }

    const learner = await prisma.learner.findUnique({ where: { id: learnerId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!learner || !course) {
      res.status(404).json({ success: false, error: 'Learner or Course not found' });
      return;
    }

    const internalId = await ensureUniqueInternalId();
    const publicNumber = await ensureUniquePublicNumber(trainingCenterId, course.code);
    const shortCode = await ensureUniqueShortCode();

    let result: any = null;
    if (sessionId) {
      result = await prisma.result.findFirst({
        where: {
          enrollment: {
            learnerId,
            sessionId,
          },
        },
      });
    }

    const fingerprintData = {
      internalId,
      publicNumber,
      shortCode,
      learnerId,
      courseId,
      issuedAt: new Date().toISOString(),
    };
    const cryptographicFingerprint = generateCryptographicFingerprint(fingerprintData);

    const verificationUrl = `${process.env.VERIFICATION_URL || 'http://localhost:3001'}/api/public/verify/${shortCode}`;

    const certificate = await prisma.certificate.create({
      data: {
        internalId,
        publicNumber,
        shortCode,
        learnerId,
        courseId,
        sessionId: sessionId || null,
        templateId: templateId || null,
        startDate: learner.createdAt,
        issuedAt: new Date(),
        result: result ? `${result.averageScore}%` : null,
        mention: result?.mention || null,
        verificationUrl,
        cryptographicFingerprint,
        status: 'DRAFT',
        trainingCenterId,
        createdBy: req.user!.id,
      },
    });

    await prisma.certificateEvent.create({
      data: {
        certificateId: certificate.id,
        eventType: 'GENERATED',
        description: 'Certificate generated',
        performedBy: req.user!.id,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'GENERATE_CERTIFICATE',
      entity: 'Certificate',
      entityId: certificate.id,
      newValue: { publicNumber, shortCode, learnerId, courseId },
    });

    res.status(201).json({
      success: true,
      data: certificate,
      message: 'Certificate generated successfully',
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/batch-generate
router.post('/batch-generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentIds, templateId, trainingCenterId } = req.body;
    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      res.status(400).json({ success: false, error: 'enrollmentIds array is required' });
      return;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: {
        learner: true,
        session: { include: { course: true } },
        results: true,
      },
    });

    const created = [];
    for (const enrollment of enrollments) {
      try {
        const existingCert = await prisma.certificate.findFirst({
          where: { learnerId: enrollment.learnerId, courseId: enrollment.session.courseId },
        });
        if (existingCert) {
          created.push({ enrollmentId: enrollment.id, error: 'Certificate already exists', certificateId: existingCert.id });
          continue;
        }

        const internalId = await ensureUniqueInternalId();
        const publicNumber = await ensureUniquePublicNumber(trainingCenterId, enrollment.session.course.code);
        const shortCode = await ensureUniqueShortCode();

        const result = enrollment.results[0];
        const fingerprintData = { internalId, publicNumber, shortCode, learnerId: enrollment.learnerId, courseId: enrollment.session.courseId };
        const cryptographicFingerprint = generateCryptographicFingerprint(fingerprintData);
        const verificationUrl = `${process.env.VERIFICATION_URL || 'http://localhost:3001'}/api/public/verify/${shortCode}`;

        const certificate = await prisma.certificate.create({
          data: {
            internalId, publicNumber, shortCode,
            learnerId: enrollment.learnerId,
            courseId: enrollment.session.courseId,
            sessionId: enrollment.sessionId,
            templateId: templateId || null,
            startDate: enrollment.session.startDate,
            endDate: enrollment.session.endDate,
            issuedAt: new Date(),
            result: result ? `${result.averageScore}%` : null,
            mention: result?.mention || null,
            verificationUrl, cryptographicFingerprint,
            status: 'DRAFT',
            trainingCenterId,
            createdBy: req.user!.id,
          },
        });
        created.push(certificate);
      } catch (err: any) {
        created.push({ enrollmentId: enrollment.id, error: err.message });
      }
    }

    res.json({
      success: true,
      data: created,
      message: `Batch generation complete: ${created.filter((c: any) => !c.error).length} created`,
    });
  } catch (error) {
    console.error('Batch generate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/certificates/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        learner: true,
        course: true,
        session: true,
        template: true,
        versions: { orderBy: { versionNumber: 'desc' } },
        approvals: { include: { approver: true }, orderBy: { createdAt: 'desc' } },
        events: { orderBy: { createdAt: 'desc' } },
        shares: true,
        _count: { select: { downloads: true } },
      },
    });

    if (!certificate) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/certificates/:id/download
router.get('/:id/download', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        learner: true,
        course: true,
        session: true,
        template: true,
      },
    });

    if (!certificate) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    const pdfBuffer = await generateDemoCertificate();

    if (req.user) {
      await prisma.certificateDownload.create({
        data: {
          certificateId: certificate.id,
          downloadedBy: req.user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      await prisma.certificateEvent.create({
        data: {
          certificateId: certificate.id,
          eventType: 'DOWNLOADED',
          description: 'Certificate downloaded',
          performedBy: req.user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.shortCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/:id/revoke
router.post('/:id/revoke', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const certificate = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!certificate) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    const { reason } = req.body;

    const updated = await prisma.certificate.update({
      where: { id: req.params.id },
      data: {
        status: 'REVOKED',
        revocationReason: reason || null,
        revocationDate: new Date(),
        revokedBy: req.user!.id,
      },
    });

    await prisma.certificateEvent.create({
      data: {
        certificateId: certificate.id,
        eventType: 'REVOKED',
        description: reason || 'Certificate revoked',
        performedBy: req.user!.id,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'REVOKE_CERTIFICATE',
      entity: 'Certificate',
      entityId: certificate.id,
      newValue: { status: 'REVOKED', reason },
    });

    res.json({ success: true, data: updated, message: 'Certificate revoked successfully' });
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/:id/replace
router.post('/:id/replace', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const original = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!original) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    const internalId = await ensureUniqueInternalId();
    const publicNumber = await ensureUniquePublicNumber(original.trainingCenterId);
    const shortCode = await ensureUniqueShortCode();

    const fingerprintData = { internalId, publicNumber, shortCode, learnerId: original.learnerId, courseId: original.courseId };
    const cryptographicFingerprint = generateCryptographicFingerprint(fingerprintData);
    const verificationUrl = `${process.env.VERIFICATION_URL || 'http://localhost:3001'}/api/public/verify/${shortCode}`;

    const replacement = await prisma.certificate.create({
      data: {
        internalId, publicNumber, shortCode,
        learnerId: original.learnerId,
        courseId: original.courseId,
        sessionId: original.sessionId,
        templateId: original.templateId,
        startDate: original.startDate,
        endDate: original.endDate,
        duration: original.duration,
        result: original.result,
        mention: original.mention,
        issuedAt: new Date(),
        verificationUrl, cryptographicFingerprint,
        status: 'ISSUED',
        replacedByCertificateId: null,
        trainingCenterId: original.trainingCenterId,
        createdBy: req.user!.id,
      },
    });

    await prisma.certificate.update({
      where: { id: original.id },
      data: {
        status: 'REPLACED',
        replacedByCertificateId: replacement.id,
        revocationDate: new Date(),
        revokedBy: req.user!.id,
      },
    });

    await prisma.certificateEvent.create({
      data: {
        certificateId: replacement.id,
        eventType: 'REPLACED',
        description: `Replaced certificate ${original.publicNumber}`,
        performedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      data: { original: original.id, replacement },
      message: 'Certificate replaced successfully',
    });
  } catch (error) {
    console.error('Replace certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/certificates/verify/:identifier
router.get('/verify/:identifier', async (req: AuthRequest, res: Response) => {
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
        learner: { select: { firstName: true, lastName: true, matricule: true } },
        course: { select: { title: true, code: true } },
        session: { select: { reference: true, startDate: true, endDate: true } },
      },
    });

    if (!certificate) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    if (['REVOKED', 'SUSPENDED', 'EXPIRED', 'REPLACED', 'ARCHIVED'].includes(certificate.status)) {
      res.json({
        success: true,
        data: {
          valid: false,
          status: certificate.status,
          revocationReason: certificate.revocationReason,
          learner: certificate.learner,
          course: certificate.course,
        },
        message: 'Certificate is not valid',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        status: certificate.status,
        publicNumber: certificate.publicNumber,
        shortCode: certificate.shortCode,
        learner: certificate.learner,
        course: certificate.course,
        session: certificate.session,
        issuedAt: certificate.issuedAt,
        result: certificate.result,
        mention: certificate.mention,
        expiresAt: certificate.expiresAt,
        verificationUrl: certificate.verificationUrl,
      },
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
