import { body } from 'express-validator';
import Faq from '../models/Faq.js';
import { createCrudRouter } from './crudRouter.js';

const fields = [
  body('question').isString().trim().notEmpty(),
  body('answer').isString().trim().notEmpty(),
  body('category').isString().trim().notEmpty(),
  body('keywords').optional().isArray(),
];

export default createCrudRouter(Faq, { createValidators: fields, updateValidators: fields });
