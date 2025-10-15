const express = require('express');
const router = express.Router();

// Landing temporária
router.get('/', (req, res) => {
  return res.render('index', { title: 'EasySmart IoT' });
});

// Login / Register (views já existentes ou em breve)
router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

// Dashboard protege via token no client (placeholder)
router.get('/dashboard', (req, res) => res.render('dashboard'));

module.exports = router;
