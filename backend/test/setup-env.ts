process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/sistema_prestamos_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-thirty-two-characters';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-thirty-two-characters';
process.env.CORS_ORIGIN = 'http://localhost:4200';
process.env.LOG_LEVEL = 'error';
