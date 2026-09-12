import { body } from 'express-validator';
import Event from '../models/Event.js';
import { createCrudRouter } from './crudRouter.js';

const fields = [
  body('title').isString().trim().notEmpty(),
  body('date').isISO8601(),
  body('location').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('imageId').optional().isMongoId(),
];

export default createCrudRouter(Event, { createValidators: fields, updateValidators: fields });
