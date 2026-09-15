import { body } from 'express-validator';
import Event from '../models/Event.js';
import { createCrudRouter } from './crudRouter.js';
import { requireAdmin } from '../middleware/auth.js';

const fields = [
  body('title').isString().trim().notEmpty(),
  body('date').isISO8601(),
  body('location').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('imageUrl').optional({ checkFalsy: true }).isString().trim(),
  body('registrationLink')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Registration link must be a full http(s) URL'),
];

export default createCrudRouter(Event, {
  createValidators: fields,
  updateValidators: fields,
  protect: [requireAdmin],
});
