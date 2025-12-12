import { Router } from 'express';
import { prisma } from '../config/database';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { validateRequest } from '../middleware/validationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import { loginLimiter } from '../middleware/rateLimiter';
import { loginSchema, registerSchema, refreshTokenSchema } from '../validators/authValidators';

const router = Router();
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', loginLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

export default router;
