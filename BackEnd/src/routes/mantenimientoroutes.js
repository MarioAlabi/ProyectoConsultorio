import { Router } from 'express';
import { backupDB, restoreDB } from '../controllers/mantenimiento.controller.js';
import { isAdmin } from '../middleware/auth.middleware.js'; // Tu middleware de seguridad

const router = Router();

router.get('/backup', isAdmin, backupDB);
router.post('/restore', isAdmin, restoreDB);

export default router;