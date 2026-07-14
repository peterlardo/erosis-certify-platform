import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { sendPasswordResetEmail } from '../services/email';

const router = Router();

function generateToken(user: any): string {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
    },
    secret,
    { expiresIn }
  );
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      role: roles[0] || '',
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      result: 'SUCCESS',
    });

    const token = generateToken({ ...user, roles, permissions });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          civility: user.civility,
          phone: user.phone,
          photo: user.photo,
          isMfaEnabled: user.isMfaEnabled,
          roles,
          permissions,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, civility, phone } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
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

    const defaultRole = await prisma.role.findFirst({ where: { isSystem: true } });
    if (defaultRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: defaultRole.id },
      });
    }

    res.status(201).json({
      success: true,
      data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      return;
    }

    const resetToken = jwt.sign({ id: user.id, purpose: 'password-reset' }, process.env.JWT_SECRET || 'default-secret', {
      expiresIn: '1h',
    });

    await sendPasswordResetEmail(email, resetToken);

    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, error: 'Token and password are required' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch {
      res.status(400).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    if (decoded.purpose !== 'password-reset') {
      res.status(400).json({ success: false, error: 'Invalid token' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );

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
        roles,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, civility, phone, photo } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(civility !== undefined && { civility }),
        ...(phone !== undefined && { phone }),
        ...(photo !== undefined && { photo }),
      },
    });

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
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
