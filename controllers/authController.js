const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

class AuthController {
  static async register(req, res) {
    const { name, email, username, password } = req.body;
    
    try {
      // 1. Criar Tenant
      const tenant = Tenant.create(name, email);
      
      // 2. Criar User Owner
      const user = await User.create(tenant.id, username, email, password, 'owner');
      
      // 3. Gerar JWT com tenant_id e plan
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          tenant_id: tenant.id,
          plan: tenant.plan,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.status(201).json({ 
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          trial_ends_at: tenant.trial_ends_at
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    const { username, password } = req.body;
    
    try {
      const user = User.findByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verificar se tenant está ativo
      if (!Tenant.isActive(user.tenant_id)) {
        return res.status(403).json({ 
          error: 'Account suspended or trial expired',
          action: 'upgrade_required'
        });
      }
      
      const isValid = await User.verifyPassword(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const tenant = Tenant.findById(user.tenant_id);
      
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          tenant_id: tenant.id,
          plan: tenant.plan,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          trial_ends_at: tenant.trial_ends_at
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = AuthController;
