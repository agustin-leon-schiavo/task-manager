import { Router } from 'express';
import { chatWithAssistant } from '../controllers/assistantController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Protegemos la ruta del chat para que solo usuarios logueados puedan acceder
router.post('/chat', protect, chatWithAssistant);

export default router;
