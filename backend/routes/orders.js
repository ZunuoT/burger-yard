const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

let inMemoryOrders = [];
let orderCounter = 1;

const isDBConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

const genOrderNum = () => `BY-${String(orderCounter++).padStart(4, '0')}`;

// POST create order (public)
router.post('/', async (req, res) => {
  try {
    const { customer, items, orderType, deliveryLocation, specialInstructions, paymentMethod } = req.body;

    if (!customer?.name || !customer?.phone || !items?.length || !orderType) {
      console.log('400 Debug - customer:', JSON.stringify(customer), 'items:', items?.length, 'orderType:', orderType);
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        debug: { hasName: !!customer?.name, hasPhone: !!customer?.phone, itemCount: items?.length, hasOrderType: !!orderType }
      });
    }

    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const deliveryFee = orderType === 'delivery' ? 5 : 0;
    const total = subtotal + deliveryFee;

    if (isDBConnected()) {
      const order = await Order.create({
        customer, items, orderType, deliveryLocation,
        specialInstructions, paymentMethod, subtotal, deliveryFee, total
      });
      return res.status(201).json({ success: true, data: order });
    }

    const order = {
      _id: `mem_${Date.now()}`,
      orderNumber: genOrderNum(),
      customer, items, orderType, deliveryLocation,
      specialInstructions, paymentMethod: paymentMethod || 'cash',
      subtotal, deliveryFee, total,
      status: 'pending', paymentStatus: 'unpaid',
      estimatedTime: 15,
      createdAt: new Date()
    };
    inMemoryOrders.push(order);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET all orders (admin)
router.get('/', protect, async (req, res) => {
  try {
    if (isDBConnected()) {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: orders.length, data: orders });
    }
    res.json({ success: true, count: inMemoryOrders.length, data: [...inMemoryOrders].reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single order by order number (public - for tracking)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    if (isDBConnected()) {
      const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, data: order });
    }
    const order = inMemoryOrders.find(o => o.orderNumber === req.params.orderNumber.toUpperCase());
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Estimated time in seconds for each status stage
const STAGE_TIMES = {
  confirmed:  2 * 60,   // 2 min until preparing
  preparing: 10 * 60,   // 10 min until ready
  ready:     10 * 60,   // 10 min to collect (pickup) / deliver
  delivered:  0,
  cancelled:  0,
  pending:    1 * 60,   // 1 min to confirm
};

// PATCH update order status (admin)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const estimatedSeconds = STAGE_TIMES[status] || 0;
    const stageStartedAt = new Date();

    if (isDBConnected()) {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status, estimatedTime: Math.round(estimatedSeconds / 60), stageStartedAt },
        { new: true }
      );
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, data: order });
    }
    const order = inMemoryOrders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.estimatedSeconds = estimatedSeconds;
    order.stageStartedAt = stageStartedAt;
    order.estimatedTime = Math.round(estimatedSeconds / 60);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET order stats (admin)
router.get('/stats/summary', protect, async (req, res) => {
  try {
    if (isDBConnected()) {
      const [total, pending, today] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
      ]);
      const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
      return res.json({ success: true, data: { total, pending, today, revenue: revenue[0]?.total || 0 } });
    }
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    res.json({
      success: true,
      data: {
        total: inMemoryOrders.length,
        pending: inMemoryOrders.filter(o => o.status === 'pending').length,
        today: inMemoryOrders.filter(o => new Date(o.createdAt) >= todayStart).length,
        revenue: inMemoryOrders.reduce((s, o) => s + o.total, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
