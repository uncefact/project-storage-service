import express, { Router } from 'express';
import path from 'path';
import { publicRouter } from './public';
import { privateRouter } from './private';
import { deleteRouter } from './delete';
import { LOCAL_DIRECTORY, __dirname } from '../../config';

export const v4Router = Router();

v4Router.use('/public', publicRouter);
v4Router.use('/private', privateRouter);
v4Router.use('/', deleteRouter);
v4Router.use(express.static(path.join(__dirname, LOCAL_DIRECTORY)));
