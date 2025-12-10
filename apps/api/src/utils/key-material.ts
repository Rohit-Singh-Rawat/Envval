import { db } from '@envval/db';
import { user } from '@envval/db/schema';
import { eq } from 'drizzle-orm';
import {
	decryptKeyMaterialWithMaster,
	encryptKeyMaterialWithMaster,
	generateKeyMaterial,
} from './crypto-keys';

/**
 * Fetch user keyMaterial; if missing, create, encrypt, persist, and return plaintext.
 * Requires KEY_MATERIAL_MASTER_KEY env to decrypt/encrypt.
 */
export async function getOrCreateUserKeyMaterial(userId: string): Promise<string> {
	const rows = await db.select().from(user).where(eq(user.id, userId)).limit(1);
	if (rows.length === 0) {
		throw new Error('User not found');
	}
	const u = rows[0];
	if (u.keyMaterialEnc && u.keyMaterialIv) {
		return decryptKeyMaterialWithMaster(u.keyMaterialEnc, u.keyMaterialIv);
	}

	const keyMaterial = generateKeyMaterial();
	const enc = encryptKeyMaterialWithMaster(keyMaterial);

	await db
		.update(user)
		.set({
			keyMaterialEnc: enc.ciphertext,
			keyMaterialIv: enc.iv,
			keyMaterialKeyId: enc.keyId,
		})
		.where(eq(user.id, userId));

	return keyMaterial;
}
