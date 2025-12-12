// import { db } from '@envval/db';
// import { userKeyMaterial } from '@envval/db/schema';
// import { eq } from 'drizzle-orm';
// import {
// 	decryptKeyMaterialWithMaster,
// 	encryptKeyMaterialWithMaster,
// 	generateKeyMaterial,
// } from '@/shared/utils/crypto';

// export class KeyMaterialService {
// 	/**
// 	 * Fetch user keyMaterial; if missing, create, encrypt, persist, and return plaintext.
// 	 * Requires KEY_MATERIAL_MASTER_KEY env to decrypt/encrypt.
// 	 */
// 	async getOrCreate(userId: string): Promise<string> {
// 		const rows = await db
// 			.select()
// 			.from(userKeyMaterial)
// 			.where(eq(userKeyMaterial.userId, userId))
// 			.limit(1);

// 		if (rows.length > 0) {
// 			const u = rows[0];
// 			return decryptKeyMaterialWithMaster(u.keyMaterialEnc, u.keyMaterialIv);
// 		}

// 		const keyMaterial = generateKeyMaterial();
// 		const enc = encryptKeyMaterialWithMaster(keyMaterial);

// 		await db.insert(userKeyMaterial).values({
// 			userId,
// 			keyMaterialEnc: enc.ciphertext,
// 			keyMaterialIv: enc.iv,
// 			keyMaterialKeyId: enc.keyId,
// 		});

// 		return keyMaterial;
// 	}
// }
