import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '@neighbortools/shared-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

interface UserInfo {
  userId: string;
  role: string;
}

// Cache for user info to avoid repeated lookups
const userInfoCache = new Map<string, { info: UserInfo; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Authorization token required'));
    }

    const token = authHeader.substring(7);

    // Verify JWT
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json(errorResponse('Token expired'));
      }
      return res.status(401).json(errorResponse('Invalid token'));
    }

    // Get user info (from cache or user service)
    const userInfo = await getUserInfo(payload.userId);
    if (!userInfo) {
      return res.status(401).json(errorResponse('User not found'));
    }

    // Add user info to headers for downstream services
    req.headers['x-user-id'] = userInfo.userId;
    req.headers['x-user-role'] = userInfo.role;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(errorResponse('Authentication error'));
  }
}

async function getUserInfo(userId: string): Promise<UserInfo | null> {
  // Check cache
  const cached = userInfoCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.info;
  }

  // Fetch from user service
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${userServiceUrl}/users/${userId}`, {
      headers: {
        'x-user-id': userId,
        'x-user-role': 'SYSTEM', // Internal request
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      return null;
    }

    const userInfo: UserInfo = {
      userId: data.data.id,
      role: data.data.role,
    };

    // Cache the result
    userInfoCache.set(userId, {
      info: userInfo,
      expires: Date.now() + CACHE_TTL,
    });

    return userInfo;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    // Return cached even if expired in case of service unavailability
    if (cached) {
      return cached.info;
    }
    return null;
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userInfoCache.entries()) {
    if (value.expires < now) {
      userInfoCache.delete(key);
    }
  }
}, 60 * 1000); // Every minute
