export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  department: string;
  salary: number;
  joinDate: string;
  status: "active" | "inactive" | "pending";
  projects: number;
  lastActive: string;
}

export const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
];

export const roles: User["role"][] = ["admin", "editor", "viewer"];
export const statuses: User["status"][] = ["active", "inactive", "pending"];
