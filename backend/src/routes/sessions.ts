import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// GET /api/sessions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const courseId = req.query.courseId as string;
    const trainerId = req.query.trainerId as string;
    const trainingCenterId = req.query.trainingCenterId as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;
    if (trainerId) where.trainerId = trainerId;
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;
    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [sessions, total] = await Promise.all([
      prisma.courseSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          course: true,
          trainer: true,
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.courseSession.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.courseSession.findUnique({
      where: { id: req.params.id },
      include: {
        course: true,
        trainer: true,
        pedagogicalManager: true,
        defaultTemplate: true,
        enrollments: {
          include: {
            learner: true,
            attendances: true,
            assessments: true,
            results: true,
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      reference, courseId, startDate, endDate, schedule, timezone,
      trainerId, pedagogicalManagerId, maxCapacity, meetingLink,
      meetingPlatform, location, language, defaultTemplateId,
      signatories, trainingCenterId,
    } = req.body;

    if (!reference || !courseId || !startDate || !endDate || !trainerId || !trainingCenterId) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const existing = await prisma.courseSession.findUnique({ where: { reference } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Session reference already exists' });
      return;
    }

    const session = await prisma.courseSession.create({
      data: {
        reference, courseId,
        startDate: new Date(startDate), endDate: new Date(endDate),
        schedule, timezone: timezone || 'Africa/Brazzaville',
        trainerId, pedagogicalManagerId, maxCapacity: maxCapacity || 30,
        meetingLink, meetingPlatform, location, language: language || 'fr',
        defaultTemplateId,
        signatories: signatories ? JSON.stringify(signatories) : '[]',
        trainingCenterId, status: 'PLANNED',
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_SESSION',
      entity: 'CourseSession',
      entityId: session.id,
      newValue: { reference, courseId },
    });

    res.status(201).json({ success: true, data: session, message: 'Session created successfully' });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/sessions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.courseSession.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const {
      startDate, endDate, schedule, timezone, trainerId, pedagogicalManagerId,
      maxCapacity, enrolledCount, meetingLink, meetingPlatform, location,
      language, status, defaultTemplateId, signatories, expectedDeliveryDate,
    } = req.body;

    const session = await prisma.courseSession.update({
      where: { id: req.params.id },
      data: {
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(schedule !== undefined && { schedule }),
        ...(timezone !== undefined && { timezone }),
        ...(trainerId !== undefined && { trainerId }),
        ...(pedagogicalManagerId !== undefined && { pedagogicalManagerId }),
        ...(maxCapacity !== undefined && { maxCapacity }),
        ...(enrolledCount !== undefined && { enrolledCount }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(meetingPlatform !== undefined && { meetingPlatform }),
        ...(location !== undefined && { location }),
        ...(language !== undefined && { language }),
        ...(status !== undefined && { status }),
        ...(defaultTemplateId !== undefined && { defaultTemplateId }),
        ...(signatories !== undefined && { signatories: JSON.stringify(signatories) }),
        ...(expectedDeliveryDate !== undefined && { expectedDeliveryDate: new Date(expectedDeliveryDate) }),
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE_SESSION',
      entity: 'CourseSession',
      entityId: session.id,
      oldValue: { status: existing.status },
      newValue: { status: status || existing.status },
    });

    res.json({ success: true, data: session, message: 'Session updated successfully' });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions/:id/enroll
router.post('/:id/enroll', async (req: AuthRequest, res: Response) => {
  try {
    const { learnerIds } = req.body;
    if (!learnerIds || !Array.isArray(learnerIds) || learnerIds.length === 0) {
      res.status(400).json({ success: false, error: 'learnerIds array is required' });
      return;
    }

    const session = await prisma.courseSession.findUnique({ where: { id: req.params.id } });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const results = [];
    for (const learnerId of learnerIds) {
      try {
        const enrollment = await prisma.enrollment.create({
          data: {
            learnerId,
            sessionId: session.id,
            status: 'REGISTERED',
            trainingCenterId: session.trainingCenterId,
          },
        });
        results.push(enrollment);
        await prisma.courseSession.update({
          where: { id: session.id },
          data: { enrolledCount: { increment: 1 } },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          results.push({ learnerId, error: 'Already enrolled' });
        } else {
          results.push({ learnerId, error: err.message });
        }
      }
    }

    await logAudit({
      userId: req.user!.id,
      action: 'ENROLL_LEARNERS',
      entity: 'Enrollment',
      entityId: session.id,
      newValue: { learnerIds, enrolledCount: results.filter((r: any) => !r.error).length },
    });

    res.json({ success: true, data: results, message: 'Enrollment processed' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/sessions/:id/enrollments
router.get('/:id/enrollments', async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { sessionId: req.params.id },
      include: {
        learner: true,
        attendances: true,
        assessments: true,
        results: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('List enrollments error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sessions/:id/attendance
router.post('/:id/attendance', async (req: AuthRequest, res: Response) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records)) {
      res.status(400).json({ success: false, error: 'records array is required' });
      return;
    }

    const session = await prisma.courseSession.findUnique({ where: { id: req.params.id } });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const results = [];
    for (const record of records) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          learnerId_sessionId: {
            learnerId: record.learnerId,
            sessionId: req.params.id,
          },
        },
      });

      if (!enrollment) {
        results.push({ learnerId: record.learnerId, error: 'Not enrolled' });
        continue;
      }

      const attendance = await prisma.attendance.create({
        data: {
          enrollmentId: enrollment.id,
          sessionDate: new Date(record.sessionDate),
          checkIn: record.checkIn ? new Date(record.checkIn) : null,
          checkOut: record.checkOut ? new Date(record.checkOut) : null,
          status: record.status || 'PRESENT',
          trainingCenterId: session.trainingCenterId,
        },
      });
      results.push(attendance);
    }

    res.json({ success: true, data: results, message: 'Attendance recorded' });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
