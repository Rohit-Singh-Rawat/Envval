import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index, pgEnum, integer } from 'drizzle-orm/pg-core';

export const sessionType = pgEnum('session_type', ['SESSION_EXTENSION', 'SESSION_WEB']);
export const deviceType = pgEnum('device_type', ['DEVICE_EXTENSION', 'DEVICE_WEB']);

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	onboarded: boolean('onboarded').default(false).notNull(),
	// Encrypted user key material (envelope encrypted with server master key)
	// keyMaterialEnc: text('key_material_enc').notNull(),
	// keyMaterialIv: text('key_material_iv').notNull(),
	// keyMaterialKeyId: text('key_material_key_id').default('default').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		sessionType: sessionType('session_type').default('SESSION_WEB').notNull(),
		userAgent: text('user_agent'),
		deviceId: text('device_id'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(table) => [
		index('session_userId_idx').on(table.userId),
		index('session_sessionType_idx').on(table.sessionType),
		index('session_deviceId_idx').on(table.deviceId),
	]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const device = pgTable(
	'device',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		type: deviceType('device_type').default('DEVICE_EXTENSION').notNull(),
		// Public key for this device (if using per-device wrapping)
		publicKey: text('public_key'),
		// User keyMaterial encrypted for this device using its public key
		wrappedUserKey: text('wrapped_user_key'),
		lastIpAddress: text('last_ip_address'),
		lastUserAgent: text('last_user_agent'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
		revoked: boolean('revoked').default(false).notNull(),
		revokedAt: timestamp('revoked_at'),
	},
	(table) => [
		index('device_userId_idx').on(table.userId),
		index('device_revoked_idx').on(table.revoked),
	]
);

export const repo = pgTable(
	'repo',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name'),
		gitRemoteUrl: text('git_remote_url'),
		workspacePath: text('workspace_path'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index('repo_userId_idx').on(table.userId), index('repo_id_idx').on(table.id)]
);

export const environment = pgTable(
	'environment',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		repoId: text('repo_id')
			.notNull()
			.references(() => repo.id, { onDelete: 'cascade' }),
		fileName: text('file_name').notNull(),
		// Latest encrypted env content (ciphertext.authTag:iv)
		content: text('content').notNull(),
		// Count of environment variables in this file
		envCount: integer('env_count').default(0).notNull(),
		// Hash of latest plaintext (SHA-256) for conflict detection
		latestHash: text('latest_hash').notNull(),
		// Device that last updated this env (for display / audit)
		lastUpdatedByDeviceId: text('last_updated_by_device_id').references(() => device.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index('env_userId_idx').on(table.userId),
		index('env_repoId_idx').on(table.repoId),
		index('env_id_idx').on(table.id),
		index('env_repoId_fileName_idx').on(table.repoId, table.fileName),
	]
);

export const auditLog = pgTable(
	'audit_log',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		deviceId: text('device_id').references(() => device.id, { onDelete: 'set null' }),
		environmentId: text('environment_id').references(() => environment.id, {
			onDelete: 'set null',
		}),
		action: text('action').notNull(),
		metadata: text('metadata'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		timestamp: timestamp('timestamp').defaultNow().notNull(),
	},
	(table) => [
		index('auditLog_userId_idx').on(table.userId),
		index('auditLog_timestamp_idx').on(table.timestamp),
		index('auditLog_action_idx').on(table.action),
		index('auditLog_environmentId_idx').on(table.environmentId),
	]
);

// Attribution for "How did you hear about us?"
export const userAttribution = pgTable(
	'user_attribution',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// User-provided fields from onboarding
		source: text('source'), // e.g., google, twitter, friend, producthunt, linkedin, youtube, reddit, hackernews, blog, podcast, other
		medium: text('medium'), // e.g., organic, social, referral, ad, direct, other
		details: text('details'), // Optional freeform details
		// Auto-captured fields (for analytics/debugging)
		referrerUrl: text('referrer_url'),
		landingPageUrl: text('landing_page_url'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('userAttribution_userId_idx').on(table.userId),
		index('userAttribution_createdAt_idx').on(table.createdAt),
		index('userAttribution_source_idx').on(table.source),
	]
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	devices: many(device),
	repos: many(repo),
	environments: many(environment),
	auditLogs: many(auditLog),
	attributions: many(userAttribution),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
	device: one(device, {
		fields: [session.deviceId],
		references: [device.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const deviceRelations = relations(device, ({ one, many }) => ({
	user: one(user, {
		fields: [device.userId],
		references: [user.id],
	}),
	sessions: many(session),
	auditLogs: many(auditLog),
}));

export const repoRelations = relations(repo, ({ one, many }) => ({
	user: one(user, {
		fields: [repo.userId],
		references: [user.id],
	}),
	environments: many(environment),
}));

export const environmentRelations = relations(environment, ({ one, many }) => ({
	user: one(user, {
		fields: [environment.userId],
		references: [user.id],
	}),
	repo: one(repo, {
		fields: [environment.repoId],
		references: [repo.id],
	}),
	auditLogs: many(auditLog),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	user: one(user, {
		fields: [auditLog.userId],
		references: [user.id],
	}),
	device: one(device, {
		fields: [auditLog.deviceId],
		references: [device.id],
	}),
	environment: one(environment, {
		fields: [auditLog.environmentId],
		references: [environment.id],
	}),
}));

export const userAttributionRelations = relations(userAttribution, ({ one }) => ({
	user: one(user, {
		fields: [userAttribution.userId],
		references: [user.id],
	}),
}));
export const jwks = pgTable('jwks', {
	id: text('id').primaryKey(),
	publicKey: text('public_key').notNull(),
	privateKey: text('private_key').notNull(),
	createdAt: timestamp('created_at').notNull(),
	expiresAt: timestamp('expires_at'),
});
