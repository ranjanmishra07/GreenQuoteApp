import { Router } from 'express';
import { UserRepository } from './repository/UserRepository';
import { UserService } from './services/UserService';
import { UserController } from './controllers/UserController';
import { authenticateToken } from './middleware/jwt';

export function createUserRouter(): Router {
  const router = Router();
  
  // Initialize dependencies
  const userRepository = new UserRepository();
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  // Public routes
  router.post('/register', (req, res) => userController.register(req, res));
  router.post('/login', (req, res) => userController.login(req, res));

  // Protected routes
  router.get('/profile', authenticateToken, (req, res) => userController.getProfile(req, res));

  return router;
}

// Export for dependency injection if needed
export { UserRepository, UserService, UserController };
