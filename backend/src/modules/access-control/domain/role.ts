export class Role {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly permissionIds: string[] = [],
  ) {}
}
