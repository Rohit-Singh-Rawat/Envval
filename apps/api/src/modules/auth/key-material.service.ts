import { db } from "@envval/db";
import { user, session } from "@envval/db/schema";
import { eq } from "drizzle-orm";
import {
  decryptKeyMaterialWithMaster,
  wrapKeyMaterialForDevice,
} from "@/shared/utils/crypto";

export class KeyMaterialService {
  /**
   * Get wrapped key material for a session.
   * PublicKey is provided in the request (not stored during login).
   * One-time delivery per session: marks session as delivered after first request.
   *
   * @param sessionId - Session ID requesting key material
   * @param publicKey - Device's public key to wrap the key material with
   * @returns Wrapped keyMaterial (base64 encrypted blob) that only this device can unwrap
   * @throws Error if session not found, or already delivered
   */
  async getWrappedKeyMaterialForSession(
    sessionId: string,
    publicKey: string,
  ): Promise<string> {
    // Fetch session with delivery status
    const [sessionRecord] = await db
      .select({
        userId: session.userId,
        keyMaterialDelivered: session.keyMaterialDelivered,
      })
      .from(session)
      .where(eq(session.id, sessionId))
      .limit(1);

    if (!sessionRecord) {
      throw new Error("Session not found");
    }

    if (sessionRecord.keyMaterialDelivered) {
      throw new Error(
        "Key material has already been delivered for this session",
      );
    }

    // Fetch user's encrypted keyMaterial
    const [userRecord] = await db
      .select({
        keyMaterialEnc: user.keyMaterialEnc,
        keyMaterialIv: user.keyMaterialIv,
      })
      .from(user)
      .where(eq(user.id, sessionRecord.userId))
      .limit(1);

    if (!userRecord) {
      throw new Error("User not found");
    }

    if (!userRecord.keyMaterialEnc || !userRecord.keyMaterialIv) {
      throw new Error("User key material not initialized");
    }

    // Decrypt user's keyMaterial using master key
    const keyMaterial = decryptKeyMaterialWithMaster(
      userRecord.keyMaterialEnc,
      userRecord.keyMaterialIv,
    );

    // Wrap keyMaterial with provided publicKey
    const wrappedUserKey = wrapKeyMaterialForDevice(publicKey, keyMaterial);

    // Mark as delivered (one-time) and store the publicKey used
    await db
      .update(session)
      .set({
        publicKey,
        keyMaterialDelivered: true,
        keyMaterialDeliveredAt: new Date(),
      })
      .where(eq(session.id, sessionId));

    return wrappedUserKey;
  }
}
