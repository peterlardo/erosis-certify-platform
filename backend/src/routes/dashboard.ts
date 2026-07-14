import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const trainingCenterId = req.query.trainingCenterId as string;
    const where = trainingCenterId ? { trainingCenterId } : {};

    const [
      totalCertificates,
      totalLearners,
      totalCourses,
      totalSessions,
      totalTrainers,
      totalUsers,
      certificatesByStatus,
      learnersByStatus,
      sessionsByStatus,
      recentCertificates,
      totalEnrollments,
    ] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.learner.count({ where }),
      prisma.course.count({ where }),
      prisma.courseSession.count({ where }),
      prisma.trainer.count({ where }),
      prisma.user.count(),
      prisma.certificate.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.learner.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.courseSession.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          learner: { select: { firstName: true, lastName: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCertificates,
          totalLearners,
          totalCourses,
          totalSessions,
          totalTrainers,
          totalUsers,
          totalEnrollments,
        },
        certificatesByStatus: certificatesByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        learnersByStatus: learnersByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        sessionsByStatus: sessionsByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        recentCertificates,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', async (req: AuthRequest, res: Response) => {
  try {
    const trainingCenterId = req.query.trainingCenterId as string;
    const where: any = {};
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
