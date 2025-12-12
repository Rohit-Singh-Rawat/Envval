import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context';
import { auth } from '@/modules/auth/auth.service';

export const oauthApi = new Hono<AppEnv>();

// Better-auth handles all OAuth routes
oauthApi.on(['POST', 'GET'], '/*', (c) => auth.handler(c.req.raw));

