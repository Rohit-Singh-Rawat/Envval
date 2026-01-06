import { honoFactory } from '@/shared/utils/factory';
import { sessionApi } from './session.api';
import { oauthApi } from './oauth.api';
import { extensionApi } from './extension.api';
import { keyMaterialApi } from './key-material.api';

export const authRoutes = honoFactory
	.createApp()
	.route('/session', sessionApi)
	.route('/extension', extensionApi)
	.route('/device/key-material', keyMaterialApi)
	.route('/', oauthApi);
