import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(12).max(128).required(),
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
  roleIds: Joi.array().items(Joi.string().uuid()).unique().default([]),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100),
  lastName: Joi.string().trim().min(2).max(100),
  isActive: Joi.boolean(),
  roleIds: Joi.array().items(Joi.string().uuid()).unique(),
}).min(1);
