import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/authValidators';
import { UnauthorizedError, ValidationError } from '../types';
import { PrismaClient } from '@prisma/client';

export class AuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ValidationError('该邮箱已被注册');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user with profile in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          phone: input.phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Create corresponding profile based on role
      if (input.role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            studentNumber: `STU${Date.now()}`, // Generate temporary student number
            major: '',
            grade: 1,
            gpa: 0,
            skills: [],
            researchInterests: [],
            completeness: 0,
          },
        });
      } else if (input.role === 'TEACHER') {
        await tx.teacherProfile.create({
          data: {
            userId: newUser.id,
            department: '',
            title: '',
            researchFields: [],
          },
        });
      }

      return newUser;
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('账户已被禁用，请联系管理员');
    }

    // Verify password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user info (without password hash) and tokens
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('用户不存在或已被禁用');
      }

      // Generate new tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'REFRESH_TOKEN_EXPIRED') {
          throw new UnauthorizedError('刷新令牌已过期，请重新登录');
        }
        if (error.message === 'INVALID_REFRESH_TOKEN') {
          throw new UnauthorizedError('无效的刷新令牌');
        }
      }
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    return user;
  }

  /**
   * Logout user (optional - mainly for cleanup if needed)
   */
  async logout(userId: string) {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the tokens. However, we can add additional logic here
    // such as blacklisting tokens or logging the logout event.

    // For now, we'll just verify the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    return { success: true };
  }
}
