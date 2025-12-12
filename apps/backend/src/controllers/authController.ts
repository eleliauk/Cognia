import type { Response, NextFunction } from 'express';
import type { AuthRequest, ApiResponse } from '../types';
import { AuthService } from '../services/authService';
import type { LoginInput, RegisterInput, RefreshTokenInput } from '../validators/authValidators';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register a new user
   */
  register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input: RegisterInput = req.body;
      const result = await this.authService.register(input);

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input: LoginInput = req.body;
      const result = await this.authService.login(input);

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input: RefreshTokenInput = req.body;
      const result = await this.authService.refreshToken(input.refreshToken);

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user info
   */
  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const user = await this.authService.getCurrentUser(req.user.userId);

      const response: ApiResponse = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.authService.logout(req.user.userId);

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
