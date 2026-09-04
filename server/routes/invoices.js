import express from 'express';
import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Invoice } from '../models/Invoice.js';

const router = express.Router();
const statuses = ['draft', 'sent', 'paid', 'overdue'];

function parseInvoice(body) {
  const invoiceNumber = String(body.invoiceNumber || '').trim();
  const client = String(body.clientId || body.client || '').trim();
  const status = statuses.includes(body.status) ? body.status : 'draft';
  const taxRate = Number(body.taxRate || 0);
  const dueDate = new Date(body.dueDate);
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
  const errors = [];

  if (!invoiceNumber) errors.push('Invoice number is required.');
  if (!mongoose.Types.ObjectId.isValid(client)) errors.push('A valid client is required.');
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) errors.push('Tax rate must be between 0 and 100.');
  if (Number.isNaN(dueDate.getTime())) errors.push('A valid due date is required.');
  if (lineItems.length === 0) errors.push('At least one line item is required.');

  const cleanedItems = lineItems.map((item, index) => {
    const description = String(item.description || '').trim();
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!description) errors.push(`Line ${index + 1}: description is required.`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`Line ${index + 1}: quantity must be greater than 0.`);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push(`Line ${index + 1}: unit price cannot be negative.`);

    return { description, quantity, unitPrice };
  });

  if (errors.length) {
    const error = new Error('Invalid invoice data.');
    error.status = 400;
    error.details = errors;
    throw error;
  }

  return { invoiceNumber, client, status, taxRate, dueDate, lineItems: cleanedItems };
}

router.get('/', async (req, res, next) => {
  try {
    const query = { userId: req.user.id };
    const { status, clientId, from, to } = req.query;

    if (statuses.includes(status)) query.status = status;
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) query.client = clientId;
    if (from || to) {
      query.dueDate = {};
      if (from) query.dueDate.$gte = new Date(from);
      if (to) query.dueDate.$lte = new Date(to);
    }

    const invoices = await Invoice.find(query).populate('client').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = parseInvoice(req.body);
    const client = await Client.findOne({ _id: data.client, userId: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const invoice = await Invoice.create({ ...data, userId: req.user.id });
    await invoice.populate('client');
    res.status(201).json(invoice);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Invoice number already exists for this user.' });
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id }).populate('client');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!statuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid invoice status.' });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('client');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

export default router;
