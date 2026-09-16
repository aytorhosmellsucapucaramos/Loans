import type { User } from './user.js';

export type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  roleIds?: string[];
};

export type UpdateUserInput = Partial<Pick<CreateUserInput, 'firstName' | 'lastName' | 'roleIds'>> & {
  isActive?: boolean;
};

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
}
