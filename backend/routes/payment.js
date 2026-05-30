const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// In-memory fallback reference store
let verifiedRefs = new Set();

const isDBConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

// POST /api/payment/verify
// Called by frontend after Paystack popup onSuccess to confirm & save order
router.post('/verify', async (req, res) => {
  try {
    const { reference, orderData } = req.body;
    if (!reference || !orderData) {
      return res.status(400).json({ success: false, message: 'Reference and order data required' });
    }

    // Verify with Paystack API (requires secret key)
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (secretKey && secretKey !== 'sk_test_YOUR_SECRET_KEY') {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
      });
      const paystackData = await paystackRes.json();
      if (!paystackData.status || paystackData.data.status !== 'success') {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
      // Confirm amount matches (in pesewas)
      const expectedKobo = Math.round(orderData.total * 100);
      if (paystackData.data.amount < expectedKobo) {
        return res.status(400).json({ success: false, message: 'Payment amount mismatch' });
      }
    }

    // Prevent duplicate order for same reference
    if (verifiedRefs.has(reference)) {
      return res.status(409).json({ success: false, message: 'Order already processed' });
    }
    verifiedRefs.add(reference);

    // Save order with payment info
    const payload = {
      ...orderData,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      paystackReference: reference,
      status: 'confirmed'
    };

    if (isDBConnected()) {
      const order = await Order.create(payload);
      return res.status(201).json({ success: true, data: order });
    }

    // In-memory fallback
    const Order_mem = require('./orders'); // reuse counter
    const order = {
      _id: `mem_${Date.now()}`,
      orderNumber: `BY-${String(verifiedRefs.size).padStart(4, '0')}`,
      ...payload,
      createdAt: new Date()
    };
    res.status(201).json({ success: true, data: order });

  } catch (err) {
    console.error('Payment verify error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});

// POST /api/payment/webhook
// Paystack server-to-server webhook for confirmed payments
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || secret === 'sk_test_YOUR_SECRET_KEY') {
    return res.sendStatus(200);
  }

  const hash = crypto
    .createHmac('sha512', secret)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.sendStatus(401);
  }

  const event = JSON.parse(req.body);
  if (event.event === 'charge.success') {
    console.log(`✅ Webhook confirmed payment: ${event.data.reference} — GH₵${event.data.amount / 100}`);
    // You could update order status here if storing by reference
  }

  res.sendStatus(200);
});

module.exports = router;
