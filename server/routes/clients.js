import express from 'express';
import { Client } from '../models/Client.js';
import { Invoice } from '../models/Invoice.js';

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseClient(body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const billingAddress = String(body.billingAddress || '').trim();
  const errors = [];

  if (!name) errors.push('Client name is required.');
  if (!emailPattern.test(email)) errors.push('A valid email is required.');
  if (errors.length) {
    const error = new Error('Invalid client data.');
    error.status = 400;
    error.details = errors;
    throw error;
  }

  return { name, email, phone, billingAddress };
}

router.get('/', async (req, res, next) => {
  try {
    const clients = await Client.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const client = await Client.create({ ...parseClient(req.body), userId: req.user.id });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      parseClient(req.body),
      { new: true, runValidators: true }
    );

    if (!client) return res.status(404).json({ message: 'Client not found.' });
    res.json(client);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const invoiceCount = await Invoice.countDocuments({ userId: req.user.id, client: req.params.id });
    if (invoiceCount > 0) {
      return res.status(409).json({ message: 'Cannot delete a client that has invoices.' });
    }

    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
