import { Router } from 'express';
import { backupDB, restoreDB } from '../controllers/mantenimientocontroller.js';

const router = Router();

router.get('/backup', backupDB);
router.post('/restore', restoreDB);

export default router;