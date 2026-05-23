import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: [
    process.env['LOVABLE_APP_URL'] ?? '',
    process.env['FRONTEND_URL'] ?? '',
    'http://localhost:3000',
    'http://localhost:8080',
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  credentials: true,
};
