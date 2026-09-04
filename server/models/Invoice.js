import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 240 },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    invoiceNumber: { type: String, required: true, trim: true, maxlength: 60 },
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'At least one line item is required.'
      }
    },
    taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft',
      index: true
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

invoiceSchema.pre('validate', function calculateTotals(next) {
  const subtotal = this.lineItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.unitPrice || 0);
  }, 0);
  const tax = subtotal * (Number(this.taxRate || 0) / 100);

  this.subtotal = Number(subtotal.toFixed(2));
  this.tax = Number(tax.toFixed(2));
  this.total = Number((subtotal + tax).toFixed(2));
  next();
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
