import { Router } from 'express';
import { validationResult } from 'express-validator';

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

/**
 * Standard REST CRUD (list/get/create/update/delete) for a Mongoose model.
 * `protect` (typically [requireAdmin]) guards the write routes (§6).
 */
export function createCrudRouter(
  Model,
  { createValidators = [], updateValidators = [], protect = [] } = {},
) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const docs = await Model.find().sort({ createdAt: -1, _id: -1 });
      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', protect, createValidators, handleValidation, async (req, res, next) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', protect, updateValidators, handleValidation, async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', protect, async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
