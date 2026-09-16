import Joi from 'joi';

export const createRoleSchema = Joi.object({
  code: Joi.string().trim().pattern(/^[a-z][a-z0-9-]*$/).max(80).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  permissionIds: Joi.array().items(Joi.string().uuid()).unique().default([]),
});

export const updateRoleSchema = Joi.object({
  code: Joi.string().trim().pattern(/^[a-z][a-z0-9-]*$/).max(80),
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().max(500).allow(''),
  permissionIds: Joi.array().items(Joi.string().uuid()).unique(),
}).min(1);
