export type DemoRole = "Admin" | "Staff" | "Technician";

export interface DemoCredential {
  email: string;
  password: string;
  role: DemoRole;
  destination: string;
}

export const DEMO_CREDENTIALS: readonly DemoCredential[] = [
  {
    email: "admin@fixpoint.test",
    password: "Admin123!",
    role: "Admin",
    destination: "/app/admin",
  },
  {
    email: "staff@fixpoint.test",
    password: "Staff123!",
    role: "Staff",
    destination: "/app/staff",
  },
  {
    email: "tech@fixpoint.test",
    password: "Tech123!",
    role: "Technician",
    destination: "/app/technician",
  },
];
