import { Router } from 'express';
import { backupDB, restoreDB } from '../controllers/mantenimientocontroller.js';
import { isAuth } from '../middleware/isAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Ambas operaciones son destructivas: solo admin autenticado.
router.get('/backup', isAuth, requireRole([ROLES.ADMIN]), backupDB);
router.post('/restore', isAuth, requireRole([ROLES.ADMIN]), restoreDB);

export default router;