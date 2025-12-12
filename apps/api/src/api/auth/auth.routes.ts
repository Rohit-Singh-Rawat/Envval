import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context';
import { sessionApi } from './session.api';
import { oauthApi } from './oauth.api';

export const authRoutes = new Hono<AppEnv>();

authRoutes.route('/session', sessionApi);
authRoutes.route('/', oauthApi);

