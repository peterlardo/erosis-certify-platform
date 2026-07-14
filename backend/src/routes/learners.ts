import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// GET /api/learners
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const trainingCenterId = req.query.trainingCenterId as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { matricule: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;

    const [learners, total] = await Promise.all([
      prisma.learner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { enrollments: true, certificates: true } },
        },
      }),
      prisma.learner.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        learners,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List learners error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/learners/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const learner = await prisma.learner.findUnique({
      where: { id: req.params.id },
      include: {
        enrollments: {
          include: {
            session: { include: { course: true } },
            attendances: true,
            assessments: true,
            results: true,
          },
        },
        certificates: true,
      },
    });

    if (!learner) {
      res.status(404).json({ success: false, error: 'Learner not found' });
      return;
    }

    res.json({ success: true, data: learner });
  } catch (error) {
    console.error('Get learner error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/learners
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      matricule, civility, firstName, lastName, dateOfBirth, placeOfBirth,
      photo, email, phone, country, city, organization, jobTitle,
      address, language, consent, trainingCenterId,
    } = req.body;

    if (!matricule || !firstName || !lastName || !email || !trainingCenterId) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const existingEmail = await prisma.learner.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(409).json({ success: false, error: 'Email already exists' });
      return;
    }

    const existingMatricule = await prisma.learner.findUnique({ where: { matricule } });
    if (existingMatricule) {
      res.status(409).json({ success: false, error: 'Matricule already exists' });
      return;
    }

    const learner = await prisma.learner.create({
      data: {
        matricule, civility: civility || '', firstName, lastName,
        fullName: `${firstName} ${lastName}`,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        placeOfBirth, photo, email, phone: phone || '',
        country: country || '', city: city || '', organization, jobTitle,
        address, language: language || 'fr',
        consent: consent || false,
        dataConsentAt: consent ? new Date() : null,
        status: 'ACTIVE', trainingCenterId,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_LEARNER',
      entity: 'Learner',
      entityId: learner.id,
      newValue: { matricule, firstName, lastName, email },
    });

    res.status(201).json({ success: true, data: learner, message: 'Learner created successfully' });
  } catch (error) {
    console.error('Create learner error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/learners/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.learner.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Learner not found' });
      return;
    }

    const {
      matricule, civility, firstName, lastName, dateOfBirth, placeOfBirth,
      photo, email, phone, country, city, organization, jobTitle,
      address, language, consent, status,
    } = req.body;

    const data: any = {};
    if (matricule !== undefined) data.matricule = matricule;
    if (civility !== undefined) data.civility = civility;
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (firstName !== undefined || lastName !== undefined) {
      data.fullName = `${data.firstName || existing.firstName} ${data.lastName || existing.lastName}`;
    }
    if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);
    if (placeOfBirth !== undefined) data.placeOfBirth = placeOfBirth;
    if (photo !== undefined) data.photo = photo;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (country !== undefined) data.country = country;
    if (city !== undefined) data.city = city;
    if (organization !== undefined) data.organization = organization;
    if (jobTitle !== undefined) data.jobTitle = jobTitle;
    if (address !== undefined) data.address = address;
    if (language !== undefined) data.language = language;
    if (consent !== undefined) {
      data.consent = consent;
      data.dataConsentAt = consent ? new Date() : null;
    }
    if (status !== undefined) data.status = status;

    const learner = await prisma.learner.update({
      where: { id: req.params.id },
      data,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE_LEARNER',
      entity: 'Learner',
      entityId: learner.id,
    });

    res.json({ success: true, data: learner, message: 'Learner updated successfully' });
  } catch (error) {
    console.error('Update learner error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/learners/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.learner.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Learner not found' });
      return;
    }

    await prisma.learner.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE_LEARNER',
      entity: 'Learner',
      entityId: req.params.id,
    });

    res.json({ success: true, message: 'Learner deactivated successfully' });
  } catch (error) {
    console.error('Delete learner error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/learners/import
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const { learners, trainingCenterId } = req.body;
    if (!learners || !Array.isArray(learners) || learners.length === 0) {
      res.status(400).json({ success: false, error: 'learners array is required' });
      return;
    }

    const importJob = await prisma.importJob.create({
      data: {
        type: 'LEARNERS',
        fileName: 'manual-import.csv',
        fileSize: 0,
        totalRows: learners.length,
        importedRows: 0,
        failedRows: 0,
        errors: '[]',
        status: 'PROCESSING',
        trainingCenterId: trainingCenterId || '',
        createdBy: req.user!.id,
      },
    });

    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const learner of learners) {
      try {
        if (!learner.matricule || !learner.firstName || !learner.lastName || !learner.email) {
          failed++;
          errors.push({ row: learner, error: 'Missing required fields' });
          continue;
        }

        await prisma.learner.create({
          data: {
            matricule: learner.matricule,
            civility: learner.civility || '',
            firstName: learner.firstName,
            lastName: learner.lastName,
            fullName: `${learner.firstName} ${learner.lastName}`,
            email: learner.email,
            phone: learner.phone || '',
            country: learner.country || '',
            city: learner.city || '',
            organization: learner.organization || null,
            jobTitle: learner.jobTitle || null,
            language: learner.language || 'fr',
            consent: true,
            dataConsentAt: new Date(),
            status: 'ACTIVE',
            trainingCenterId: trainingCenterId || '',
          },
        });
        imported++;
      } catch (err: any) {
        failed++;
        errors.push({ row: learner, error: err.message });
      }
    }

    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        importedRows: imported,
        failedRows: failed,
        errors: JSON.stringify(errors),
        status: 'COMPLETED',
      },
    });

    res.json({
      success: true,
      data: { jobId: importJob.id, imported, failed, total: learners.length },
      message: `Imported ${imported} learners, ${failed} failed`,
    });
  } catch (error) {
    console.error('Import learners error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/learners/export
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const trainingCenterId = req.query.trainingCenterId as string;
    const where: any = {};
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;

    const learners = await prisma.learner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const csvHeader = 'Matricule,Civilité,Prénom,Nom,Email,Téléphone,Pays,Ville,Organisation,Poste,Statut';
    const csvRows = learners.map((l) =>
      `${l.matricule},${l.civility},${l.firstName},${l.lastName},${l.email},${l.phone},${l.country},${l.city},${l.organization || ''},${l.jobTitle || ''},${l.status}`
    );
    const csv = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=learners.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export learners error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/learners/:id/merge
router.post('/:id/merge', async (req: AuthRequest, res: Response) => {
  try {
    const { duplicateId } = req.body;
    if (!duplicateId) {
      res.status(400).json({ success: false, error: 'duplicateId is required' });
      return;
    }

    const primary = await prisma.learner.findUnique({ where: { id: req.params.id } });
    const duplicate = await prisma.learner.findUnique({ where: { id: duplicateId } });

    if (!primary || !duplicate) {
      res.status(404).json({ success: false, error: 'Learner not found' });
      return;
    }

    await prisma.enrollment.updateMany({
      where: { learnerId: duplicateId },
      data: { learnerId: primary.id },
    });

    await prisma.certificate.updateMany({
      where: { learnerId: duplicateId },
      data: { learnerId: primary.id },
    });

    await prisma.learner.update({
      where: { id: primary.id },
      data: {
        email: primary.email || duplicate.email,
        phone: primary.phone || duplicate.phone,
        organization: primary.organization || duplicate.organization,
        jobTitle: primary.jobTitle || duplicate.jobTitle,
      },
    });

    await prisma.learner.update({
      where: { id: duplicateId },
      data: { status: 'MERGED' },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'MERGE_LEARNERS',
      entity: 'Learner',
      entityId: primary.id,
      newValue: { mergedFrom: duplicateId },
    });

    res.json({ success: true, message: 'Learners merged successfully', data: { primaryId: primary.id } });
  } catch (error) {
    console.error('Merge learners error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
