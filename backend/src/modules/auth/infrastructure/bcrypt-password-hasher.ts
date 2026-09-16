import bcrypt from 'bcrypt';

import type { PasswordHasher } from '../domain/auth-services.js';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 12) {}
  hash(password: string): Promise<string> { return bcrypt.hash(password, this.rounds); }
  compare(password: string, hash: string): Promise<boolean> { return bcrypt.compare(password, hash); }
}
