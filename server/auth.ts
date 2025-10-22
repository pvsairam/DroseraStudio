import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { verifyMessage } from 'viem';

// Generate a random nonce for signature verification
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Verify wallet signature
export async function verifyWalletSignature(
  address: string,
  signature: `0x${string}`,
  message: string
): Promise<boolean> {
  try {
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature,
    });
    return valid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Authentication middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.substring(7);
  
  try {
    const session = await storage.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteSession(session.id);
      return res.status(401).json({ error: 'Unauthorized - Session expired' });
    }

    // Attach user to request
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

// Role-based authorization middleware
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
}
