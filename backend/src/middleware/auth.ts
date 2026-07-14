import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'default-secret';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ success: false, error: 'Missing permission: ' + permission });
      return;
    }
    next();
  };
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'default-secret';
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
    };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
