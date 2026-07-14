import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

router.use(authenticate);

// GET /api/users
router.get('/', requireRole('Super Admin', 'Admin Centre'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          civility: u.civility,
          phone: u.phone,
          photo: u.photo,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt,
          roles: u.userRoles.map((ur) => ur.role.name),
          createdAt: u.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', requireRole('Super Admin', 'Admin Centre'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        civility: user.civility,
        phone: user.phone,
        photo: user.photo,
        isActive: user.isActive,
        isMfaEnabled: user.isMfaEnabled,
        lastLoginAt: user.lastLoginAt,
        roles: user.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/users
router.post('/', requireRole('Super Admin', 'Admin Centre'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, civility, phone, roleIds, trainingCenterId } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        civility: civility || '',
        phone: phone || '',
      },
    });

    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId,
            ...(trainingCenterId ? { trainingCenterId } : {}),
          },
        });
      }
    }

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      newValue: { email, firstName, lastName },
    });

    res.status(201).json({
      success: true,
      data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', requireRole('Super Admin', 'Admin Centre'), async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, civility, phone, photo, isActive, roleIds } = req.body;
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(civility !== undefined && { civility }),
        ...(phone !== undefined && { phone }),
        ...(photo !== undefined && { photo }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (roleIds) {
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      for (const roleId of roleIds) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId },
        });
      }
    }

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      oldValue: { firstName: existing.firstName, lastName: existing.lastName },
      newValue: { firstName, lastName },
    });

    res.json({
      success: true,
      data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireRole('Super Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: user.id,
      newValue: { isActive: false },
    });

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/users/:id/suspend
router.put('/:id/suspend', requireRole('Super Admin', 'Admin Centre'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });

    await logAudit({
      userId: req.user!.id,
      action: updated.isActive ? 'UNSUSPEND_USER' : 'SUSPEND_USER',
      entity: 'User',
      entityId: user.id,
    });

    res.json({
      success: true,
      data: { id: updated.id, isActive: updated.isActive },
      message: `User ${updated.isActive ? 'activated' : 'suspended'} successfully`,
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
