import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// GET /api/templates
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const trainingCenterId = req.query.trainingCenterId as string;
    const isArchived = req.query.isArchived as string;

    const where: any = {};
    if (trainingCenterId) where.trainingCenterId = trainingCenterId;
    if (isArchived !== undefined) where.isArchived = isArchived === 'true';

    const [templates, total] = await Promise.all([
      prisma.certificateTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { certificates: true, versions: true } },
        },
      }),
      prisma.certificateTemplate.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        templates,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        _count: { select: { certificates: true } },
      },
    });

    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/templates
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, description, orientation, width, height,
      backgroundImage, backgroundColor, elements, thumbnail,
      isDefault, trainingCenterId,
    } = req.body;

    if (!name || !trainingCenterId) {
      res.status(400).json({ success: false, error: 'Name and trainingCenterId are required' });
      return;
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        description: description || null,
        orientation: orientation || 'LANDSCAPE',
        width: width || 1200,
        height: height || 850,
        backgroundImage: backgroundImage || null,
        backgroundColor: backgroundColor || '#FFFFFF',
        elements: elements ? JSON.stringify(elements) : '[]',
        thumbnail: thumbnail || null,
        isDefault: isDefault || false,
        version: 1,
        trainingCenterId,
        createdBy: req.user!.id,
      },
    });

    await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        elements: elements ? JSON.stringify(elements) : '[]',
        thumbnail: thumbnail || null,
        createdBy: req.user!.id,
        changeLog: 'Initial version',
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_TEMPLATE',
      entity: 'CertificateTemplate',
      entityId: template.id,
      newValue: { name, orientation },
    });

    res.status(201).json({ success: true, data: template, message: 'Template created successfully' });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const {
      name, description, orientation, width, height,
      backgroundImage, backgroundColor, elements, thumbnail,
      isDefault, isArchived,
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (orientation !== undefined) data.orientation = orientation;
    if (width !== undefined) data.width = width;
    if (height !== undefined) data.height = height;
    if (backgroundImage !== undefined) data.backgroundImage = backgroundImage;
    if (backgroundColor !== undefined) data.backgroundColor = backgroundColor;
    if (elements !== undefined) data.elements = JSON.stringify(elements);
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    if (isDefault !== undefined) data.isDefault = isDefault;
    if (isArchived !== undefined) data.isArchived = isArchived;
    data.version = { increment: 1 };

    const template = await prisma.certificateTemplate.update({
      where: { id: req.params.id },
      data,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE_TEMPLATE',
      entity: 'CertificateTemplate',
      entityId: template.id,
      newValue: { name, orientation },
    });

    res.json({ success: true, data: template, message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    await prisma.certificateTemplate.update({
      where: { id: req.params.id },
      data: { isArchived: true },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'ARCHIVE_TEMPLATE',
      entity: 'CertificateTemplate',
      entityId: req.params.id,
    });

    res.json({ success: true, message: 'Template archived successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/templates/:id/duplicate
router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const source = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id } });
    if (!source) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const duplicate = await prisma.certificateTemplate.create({
      data: {
        name: `${source.name} (copie)`,
        description: source.description,
        orientation: source.orientation,
        width: source.width,
        height: source.height,
        backgroundImage: source.backgroundImage,
        backgroundColor: source.backgroundColor,
        elements: source.elements,
        thumbnail: source.thumbnail,
        isDefault: false,
        version: 1,
        trainingCenterId: source.trainingCenterId,
        createdBy: req.user!.id,
      },
    });

    await prisma.templateVersion.create({
      data: {
        templateId: duplicate.id,
        versionNumber: 1,
        elements: source.elements,
        createdBy: req.user!.id,
        changeLog: 'Duplicated from ' + source.name,
      },
    });

    res.status(201).json({ success: true, data: duplicate, message: 'Template duplicated successfully' });
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/templates/:id/save-version
router.post('/:id/save-version', async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const { elements, thumbnail, changeLog } = req.body;

    const currentVersionCount = await prisma.templateVersion.count({
      where: { templateId: req.params.id },
    });

    const version = await prisma.templateVersion.create({
      data: {
        templateId: req.params.id,
        versionNumber: currentVersionCount + 1,
        elements: elements ? JSON.stringify(elements) : template.elements,
        thumbnail: thumbnail || template.thumbnail,
        createdBy: req.user!.id,
        changeLog: changeLog || `Version ${currentVersionCount + 1}`,
      },
    });

    await prisma.certificateTemplate.update({
      where: { id: req.params.id },
      data: {
        elements: elements ? JSON.stringify(elements) : template.elements,
        thumbnail: thumbnail || template.thumbnail,
        version: { increment: 1 },
      },
    });

    res.status(201).json({ success: true, data: version, message: 'Version saved successfully' });
  } catch (error) {
    console.error('Save version error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
