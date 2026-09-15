import { body } from 'express-validator';
import Image from '../models/Image.js';
import { createCrudRouter } from './crudRouter.js';
import { requireAdmin } from '../middleware/auth.js';

const fields = [
  body('title').isString().trim().notEmpty(),
  body('imageUrl').isString().trim().notEmpty(),
  body('category').isString().trim().notEmpty(),
  body('altText').isString().trim().notEmpty(),
  body('description').optional({ checkFalsy: true }).isString().trim(),
  body('relatedId').optional({ checkFalsy: true }).isMongoId(),
  body('relatedType').optional({ checkFalsy: true }).isIn(['information']),
];

export default createCrudRouter(Image, {
  createValidators: fields,
  updateValidators: fields,
  protect: [requireAdmin],
});
