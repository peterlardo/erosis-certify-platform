import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

const MASK_TYPES = [
  { value: 'GUILLOCHE', label: 'Guilloche', description: 'Pattern de fond complexe' },
  { value: 'WATERMARK', label: 'Filigrane', description: 'Marque d\'eau transparente' },
  { value: 'MICROTEXT', label: 'Micro-texte', description: 'Texte minuscule invisible à l\'œil nu' },
  { value: 'ROSACE', label: 'Rosace', description: 'Motif circulaire ornemental' },
  { value: 'ANTI_COPY', label: 'Anti-copie', description: 'Motif qui se dégrade à la photocopie' },
  { value: 'SECURE_BACKGROUND', label: 'Fond sécurisé', description: 'Fond de sécurité avec motifs' },
  { value: 'HOLOGRAPHIC', label: 'Hologramme', description: 'Zone à effet holographique' },
  { value: 'DIGITAL_SEAL', label: 'Sceau numérique', description: 'Sceau de vérification numérique' },
  { value: 'QR_CODE', label: 'Code QR', description: 'Code QR de vérification' },
  { value: 'CRYPTOGRAPHIC_FINGERPRINT', label: 'Empreinte cryptographique', description: 'Hash de vérification' },
  { value: 'INVISIBLE_ID', label: 'ID invisible', description: 'Identifiant invisible inséré dans le document' },
  { value: 'SECURITY_BORDER', label: 'Bordure de sécurité', description: 'Bordure avec motifs de sécurité' },
];

// GET /api/masks
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string;
    const trainingCenterId = req.query.trainingCenterId as string;

    const where: any = {};
    if (type) where.type = type;
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;

    const [masks, total] = await Promise.all([
      prisma.securityMask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.securityMask.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        masks,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List masks error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Public route - no auth needed
router.get('/library', async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: MASK_TYPES });
});

// All routes below require authentication
router.use(authenticate);

// GET /api/masks/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const mask = await prisma.securityMask.findUnique({ where: { id: req.params.id } });
    if (!mask) {
      res.status(404).json({ success: false, error: 'Mask not found' });
      return;
    }
    res.json({ success: true, data: mask });
  } catch (error) {
    console.error('Get mask error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/masks
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, settings, isActive, isLocked, trainingCenterId } = req.body;
    if (!name || !type || !trainingCenterId) {
      res.status(400).json({ success: false, error: 'Name, type, and trainingCenterId are required' });
      return;
    }

    const mask = await prisma.securityMask.create({
      data: {
        name,
        type,
        settings: settings ? JSON.stringify(settings) : '{}',
        isActive: isActive !== undefined ? isActive : true,
        isLocked: isLocked || false,
        trainingCenterId,
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_MASK',
      entity: 'SecurityMask',
      entityId: mask.id,
      newValue: { name, type },
    });

    res.status(201).json({ success: true, data: mask, message: 'Mask created successfully' });
  } catch (error) {
    console.error('Create mask error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/masks/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.securityMask.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Mask not found' });
      return;
    }

    const { name, type, settings, isActive, isLocked } = req.body;
    const mask = await prisma.securityMask.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(settings !== undefined && { settings: JSON.stringify(settings) }),
        ...(isActive !== undefined && { isActive }),
        ...(isLocked !== undefined && { isLocked }),
      },
    });

    res.json({ success: true, data: mask, message: 'Mask updated successfully' });
  } catch (error) {
    console.error('Update mask error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/masks/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.securityMask.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Mask not found' });
      return;
    }

    await prisma.securityMask.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Mask deactivated successfully' });
  } catch (error) {
    console.error('Delete mask error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
