import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '@seettu/shared';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  memberId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
    });
    return;
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

/**
 * Enforces that a MEMBER can only access their own records.
 * Admins and Staff bypass this restriction.
 */
export function checkMemberAccess(targetMemberId: string, req: Request, res: Response): boolean {
  if (!req.user) return false;
  if (req.user.role === 'ADMIN' || req.user.role === 'STAFF') return true;
  if (req.user.role === 'MEMBER' && req.user.memberId === targetMemberId) return true;

  res.status(403).json({
    success: false,
    error: 'Access denied: You can only view your own records',
    code: 'CROSS_MEMBER_ACCESS_FORBIDDEN',
  });
  return false;
}
