import { AdminRole } from '../enums/admin-role.enum';

export class Admin {
  id!: number;
  name!: string;
  email?: string;
  password?: string;
  role!: AdminRole;
  createdAt!: Date;
  updatedAt!: Date;
}
