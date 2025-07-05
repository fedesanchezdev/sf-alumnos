import crypto from 'crypto';

// Generar un JWT secret seguro
const generateJWTSecret = () => {
  const secret = crypto.randomBytes(64).toString('hex');
  return secret;
};

const jwtSecret = generateJWTSecret();

console.log('🔐 JWT Secret generado para Render.com:');
console.log('');
console.log(jwtSecret);
console.log('');
console.log('📋 Copiar este valor en la variable JWT_SECRET en Render.com');
console.log('⚠️  IMPORTANTE: Mantener este token SECRETO y SEGURO');
