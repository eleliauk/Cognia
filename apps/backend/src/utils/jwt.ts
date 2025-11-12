import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh tokens for a user
 */
export function generateTokens(payload: TokenPayload): AuthTokens {
  const accessToken = jwt.sign(
    payload,
    config.jwtSecret as string,
    {
      expiresIn: config.jwtExpiresIn,
    } as SignOptions
  );

  const refreshToken = jwt.sign(
    payload,
    config.jwtRefreshSecret as string,
    {
      expiresIn: config.jwtRefreshExpiresIn,
    } as SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret as string) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('INVALID_TOKEN');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwtRefreshSecret as string) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw new Error('INVALID_REFRESH_TOKEN');
  }
}
