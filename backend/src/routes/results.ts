import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// POST /api/results/:enrollmentId/grade
router.post('/:enrollmentId/grade', async (req: AuthRequest, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    const { assessments } = req.body;

    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      res.status(400).json({ success: false, error: 'assessments array is required' });
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { session: true },
    });

    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }

    const createdAssessments = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const a of assessments) {
      const assessment = await prisma.assessment.create({
        data: {
          enrollmentId,
          type: a.type || 'THEORETICAL',
          score: a.score || 0,
          maxScore: a.maxScore || 20,
          coefficient: a.coefficient || 1,
          weight: a.weight || 1,
          comments: a.comments || null,
          gradedBy: req.user!.id,
          gradedAt: new Date(),
          trainingCenterId: enrollment.trainingCenterId,
        },
      });
      createdAssessments.push(assessment);
      totalWeightedScore += (assessment.score / assessment.maxScore) * 100 * assessment.weight;
      totalWeight += assessment.weight;
    }

    const averageScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;

    let grade = '';
    let mention: string | null = null;
    let isAdmitted = false;

    if (averageScore >= 90) { grade = 'A'; mention = 'EXCELLENT'; isAdmitted = true; }
    else if (averageScore >= 80) { grade = 'B+'; mention = 'TRES_BIEN'; isAdmitted = true; }
    else if (averageScore >= 70) { grade = 'B'; mention = 'BIEN'; isAdmitted = true; }
    else if (averageScore >= 60) { grade = 'C+'; mention = 'ASSEZ_BIEN'; isAdmitted = true; }
    else if (averageScore >= 50) { grade = 'C'; mention = 'PASSABLE'; isAdmitted = true; }
    else { grade = 'F'; mention = null; isAdmitted = false; }

    let result = await prisma.result.findUnique({ where: { enrollmentId } });
    if (result) {
      result = await prisma.result.update({
        where: { enrollmentId },
        data: {
          averageScore,
          grade,
          mention,
          isAdmitted,
          status: 'PENDING',
          trainerObservations: req.body.observations || null,
        },
      });
    } else {
      result = await prisma.result.create({
        data: {
          enrollmentId,
          averageScore,
          grade,
          mention,
          isAdmitted,
          trainerObservations: req.body.observations || null,
          status: 'PENDING',
          trainingCenterId: enrollment.trainingCenterId,
        },
      });
    }

    if (enrollment.status !== 'COMPLETED') {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    await logAudit({
      userId: req.user!.id,
      action: 'SUBMIT_GRADES',
      entity: 'Result',
      entityId: result.id,
      newValue: { averageScore, grade, mention, isAdmitted },
    });

    res.json({
      success: true,
      data: { assessments: createdAssessments, result },
      message: 'Grades submitted successfully',
    });
  } catch (error) {
    console.error('Submit grades error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/results/:id/validate
router.put('/:id/validate', async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.result.findUnique({
      where: { id: req.params.id },
      include: {
        enrollment: {
          include: { learner: true },
        },
      },
    });

    if (!result) {
      res.status(404).json({ success: false, error: 'Result not found' });
      return;
    }

    const { status, comments } = req.body;
    if (!status || !['VALIDATED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Status must be VALIDATED or REJECTED' });
      return;
    }

    const updated = await prisma.result.update({
      where: { id: req.params.id },
      data: {
        status,
        pedagogicalValidation: comments || null,
        validatedBy: req.user!.id,
        validatedAt: new Date(),
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: status === 'VALIDATED' ? 'VALIDATE_RESULT' : 'REJECT_RESULT',
      entity: 'Result',
      entityId: result.id,
      oldValue: { status: result.status },
      newValue: { status },
    });

    res.json({
      success: true,
      data: updated,
      message: `Result ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Validate result error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/results/:enrollmentId
router.get('/:enrollmentId', async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.enrollmentId },
      include: {
        learner: true,
        session: { include: { course: true } },
        assessments: { orderBy: { createdAt: 'desc' } },
        results: true,
      },
    });

    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }

    res.json({ success: true, data: enrollment });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
