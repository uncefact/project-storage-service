import express, { Router } from 'express';
import path from 'path';
import { publicRouter } from './public';
import { privateRouter } from './private';
import { LOCAL_DIRECTORY, __dirname } from '../config';

export const router = Router();

router.use('/public', publicRouter);
router.use('/private', privateRouter);
router.use(express.static(path.join(__dirname, LOCAL_DIRECTORY)));
