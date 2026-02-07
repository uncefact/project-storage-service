import express, { Router } from 'express';
import path from 'path';
import { credentialsRouter } from './credentials';
import { documentsRouter } from './documents';
import { filesRouter } from './files';
import { LOCAL_DIRECTORY, __dirname } from '../config';

export const router = Router();

router.use('/credentials', credentialsRouter);
router.use('/documents', documentsRouter);
router.use('/files', filesRouter);
router.use(express.static(path.join(__dirname, LOCAL_DIRECTORY)));
