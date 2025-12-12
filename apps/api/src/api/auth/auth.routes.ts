import { honoFactory } from '@/shared/utils/factory';
import { sessionApi } from './session.api';
import { oauthApi } from './oauth.api';

export const authRoutes = honoFactory.createApp().route('/session', sessionApi).route('/', oauthApi);
