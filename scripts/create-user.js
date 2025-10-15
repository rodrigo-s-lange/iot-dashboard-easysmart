const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createUser() {
  const password = 'test123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password hash:', hash);
  
  // Deletar usuário existente
  db.prepare('DELETE FROM users WHERE username = ?').run('testuser');
  
  // Criar novo
  const stmt = db.prepare(`
    INSERT INTO users (tenant_id, username, email, password, role) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(3, 'testuser', 'test@example.com', hash, 'owner');
  
  console.log('User created with ID:', result.lastInsertRowid);
  console.log('\nCredentials:');
  console.log('Username: testuser');
  console.log('Password: test123');
}

createUser().catch(console.error);
