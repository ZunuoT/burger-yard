const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: false },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
  },
  items: [orderItemSchema],
  orderType: { type: String, enum: ['pickup', 'delivery'], required: true },
  deliveryLocation: { type: String, default: '' },
  specialInstructions: { type: String, default: '' },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['cash', 'momo', 'card'], default: 'cash' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  estimatedTime: { type: Number, default: 15 },
  estimatedSeconds: { type: Number, default: 0 },
  stageStartedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Fix: don't use next() with async pre-save in Mongoose 7+
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
    const count = await OrderModel.countDocuments();
    this.orderNumber = `BY-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
