import crypto from 'crypto';

export const deriveKey = (keyMaterial: string, deviceId: string) => {
    return crypto.pbkdf2Sync(keyMaterial, deviceId, 100000, 32, 'sha512').toString('hex');
};

export const encryptEnv = (env: string, key: string) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    let ciphertext = cipher.update(env, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    return {
ciphertext: ciphertext + '.' + authTag.toString('base64'),
iv: iv.toString('base64')
    };
};
export const decryptEnv = (ciphertext: string, iv: string, key: string) => {
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'base64'));
        decipher.setAuthTag(Buffer.from(ciphertext.split('.')[1], 'base64'));
        let plaintext = decipher.update(ciphertext.split('.')[0], 'base64', 'utf8');
        plaintext += decipher.final('utf8');
        return plaintext;
    } catch (error) {
        throw new Error('Failed to decrypt data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};      

export const hashEnvs = (envs: string[]) => {
    return crypto.createHash('sha256').update(envs.join('\n')).digest('hex');
};