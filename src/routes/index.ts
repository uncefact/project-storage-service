import { Router } from 'express';
import { v4Router } from './v4';

export const router = Router();

router.use('/v4', v4Router);
