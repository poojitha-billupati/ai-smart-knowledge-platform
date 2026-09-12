import { body } from 'express-validator';
import Image from '../models/Image.js';
import { createCrudRouter } from './crudRouter.js';

const fields = [
  body('title').isString().trim().notEmpty(),
  body('imageUrl').isString().trim().notEmpty(),
  body('category').isString().trim().notEmpty(),
  body('altText').isString().trim().notEmpty(),
  body('relatedId').optional().isMongoId(),
  body('relatedType').optional().isIn(['event', 'information']),
];

export default createCrudRouter(Image, { createValidators: fields, updateValidators: fields });
