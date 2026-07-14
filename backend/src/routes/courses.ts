import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// GET /api/courses
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const categoryId = req.query.categoryId as string;
    const search = req.query.search as string;
    const trainingCenterId = req.query.trainingCenterId as string;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          mainTrainer: true,
          sessions: { take: 1, orderBy: { startDate: 'desc' } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List courses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        mainTrainer: true,
        pedagogicalManager: true,
        sessions: { orderBy: { startDate: 'desc' } },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/courses
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      code, title, categoryId, description, objectives, skills, prerequisites,
      duration, durationUnit, language, mode, level, program,
      pedagogicalManagerId, mainTrainerId, certificateType,
      passingThreshold, minAttendanceRate, validityDuration, validityUnit,
      trainingCenterId,
    } = req.body;

    if (!code || !title || !trainingCenterId) {
      res.status(400).json({ success: false, error: 'Code, title, and trainingCenterId are required' });
      return;
    }

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Course code already exists' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        code, title, categoryId, description, objectives, skills, prerequisites,
        duration: duration || 0, durationUnit: durationUnit || 'days',
        language: language || 'fr', mode: mode || 'PRESENTIAL', level: level || 'BEGINNER',
        program, pedagogicalManagerId, mainTrainerId,
        certificateType: certificateType || 'ATTENDANCE',
        passingThreshold: passingThreshold || 70, minAttendanceRate: minAttendanceRate || 80,
        validityDuration, validityUnit, trainingCenterId,
        status: 'DRAFT',
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_COURSE',
      entity: 'Course',
      entityId: course.id,
      newValue: { code, title },
    });

    res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/courses/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    const {
      code, title, categoryId, description, objectives, skills, prerequisites,
      duration, durationUnit, language, mode, level, program,
      pedagogicalManagerId, mainTrainerId, certificateType,
      passingThreshold, minAttendanceRate, validityDuration, validityUnit, status,
    } = req.body;

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...(code !== undefined && { code }),
        ...(title !== undefined && { title }),
        ...(categoryId !== undefined && { categoryId }),
        ...(description !== undefined && { description }),
        ...(objectives !== undefined && { objectives }),
        ...(skills !== undefined && { skills }),
        ...(prerequisites !== undefined && { prerequisites }),
        ...(duration !== undefined && { duration }),
        ...(durationUnit !== undefined && { durationUnit }),
        ...(language !== undefined && { language }),
        ...(mode !== undefined && { mode }),
        ...(level !== undefined && { level }),
        ...(program !== undefined && { program }),
        ...(pedagogicalManagerId !== undefined && { pedagogicalManagerId }),
        ...(mainTrainerId !== undefined && { mainTrainerId }),
        ...(certificateType !== undefined && { certificateType }),
        ...(passingThreshold !== undefined && { passingThreshold }),
        ...(minAttendanceRate !== undefined && { minAttendanceRate }),
        ...(validityDuration !== undefined && { validityDuration }),
        ...(validityUnit !== undefined && { validityUnit }),
        ...(status !== undefined && { status }),
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE_COURSE',
      entity: 'Course',
      entityId: course.id,
      oldValue: { title: existing.title, status: existing.status },
      newValue: { title, status },
    });

    res.json({ success: true, data: course, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    await prisma.course.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'ARCHIVE_COURSE',
      entity: 'Course',
      entityId: req.params.id,
    });

    res.json({ success: true, message: 'Course archived successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/courses/categories/list
router.get('/categories/list', async (req: AuthRequest, res: Response) => {
  try {
    const trainingCenterId = req.query.trainingCenterId as string;
    const where: any = {};
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;

    const categories = await prisma.courseCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
