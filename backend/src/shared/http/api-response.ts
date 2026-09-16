import type { Response } from 'express';

export const success = <T>(response: Response, data: T, message = 'Operación realizada correctamente', status = 200): Response =>
  response.status(status).json({ success: true, message, data, errors: [] });

export const failure = (response: Response, message: string, errors: unknown[] = [], status = 500): Response =>
  response.status(status).json({ success: false, message, data: null, errors });
