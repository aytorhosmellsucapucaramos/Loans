import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(12).max(128).required(),
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().required(),
});
