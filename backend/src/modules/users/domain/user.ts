export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly passwordHash: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly roles: string[] = [],
    public readonly permissions: string[] = [],
  ) {}

  toPublic(): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = this;
    return publicUser;
  }
}
