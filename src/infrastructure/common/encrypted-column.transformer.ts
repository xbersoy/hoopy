import { ValueTransformer } from 'typeorm';
import { encrypt, decrypt } from './encryption.util';

export class EncryptedColumnTransformer implements ValueTransformer {
  to(value: string | null): string | null {
    if (!value) return value;
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    return encrypt(value, key);
  }

  from(value: string | null): string | null {
    if (!value) return value;
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    return decrypt(value, key);
  }
}
