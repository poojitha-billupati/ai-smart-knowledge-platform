import { body } from 'express-validator';
import Information from '../models/Information.js';
import { createCrudRouter } from './crudRouter.js';
import { requireAdmin } from '../middleware/auth.js';

const fields = [
  body('title').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('category').isString().trim().notEmpty(),
  body('tags').optional().isArray(),
];

export default createCrudRouter(Information, {
  createValidators: fields,
  updateValidators: fields,
  protect: [requireAdmin],
});
