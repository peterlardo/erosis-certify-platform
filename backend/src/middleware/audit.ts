import prisma from '../config/database';

export interface AuditData {
  userId: string;
  role?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  result?: string;
  trainingCenterId?: string;
}

export async function logAudit(data: AuditData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        role: data.role || '',
        action: data.action,
        entity: data.entity || '',
        entityId: data.entityId || null,
        oldValue: JSON.stringify(data.oldValue || {}),
        newValue: JSON.stringify(data.newValue || {}),
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        result: data.result || null,
        trainingCenterId: data.trainingCenterId || null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

export function createAuditMiddleware(action: string, entity?: string) {
  return async (req: any, _res: any, next: any) => {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.roles?.[0] || '',
        action,
        entity,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        trainingCenterId: req.body?.trainingCenterId || req.query?.trainingCenterId,
      });
    }
    next();
  };
}
