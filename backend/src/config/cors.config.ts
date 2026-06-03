import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const ALLOWED_ORIGINS = [
  process.env['LOVABLE_APP_URL'],
  process.env['FRONTEND_URL'],
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
].filter(Boolean) as string[];

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origin (mobile, Postman, etc.)
    if (!origin) return callback(null, true);

    // Permite qualquer subdomínio do Lovable (preview e produção)
    if (origin.endsWith('.lovable.app')) return callback(null, true);
    if (origin.endsWith('.lovableproject.com')) return callback(null, true);

    // Permite origens explicitamente listadas
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    callback(new Error(`CORS: origem não permitida — ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  credentials: true,
};
