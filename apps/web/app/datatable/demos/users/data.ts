import type { User } from "./types";
import { departments, roles, statuses } from "./types";

const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "William", "Mia", "James", "Charlotte", "Oliver", "Amelia",
  "Benjamin", "Harper", "Elijah", "Evelyn", "Lucas", "Abigail", "Henry",
  "Emily", "Alexander", "Elizabeth", "Michael", "Sofia", "Daniel", "Avery",
  "Matthew", "Ella", "Aiden", "Scarlett", "Jackson", "Grace", "Sebastian",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateUsers(count: number): User[] {
  const random = seededRandom(42);
  const baseDate = new Date("2025-01-01").getTime();

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length]!;
    const lastName = lastNames[i % lastNames.length]!;
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const department = departments[i % departments.length]!;
    const role = roles[i % roles.length]!;
    const status = statuses[i % statuses.length]!;
    const salary = Math.floor(50000 + random() * 150000);
    const projects = Math.floor(random() * 25);
    const joinDate = new Date(baseDate - Math.floor(random() * 5 * 365 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split("T")[0]!;
    const lastActive = new Date(baseDate - Math.floor(random() * 30 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split("T")[0]!;

    return {
      id: `user-${i + 1}`,
      name,
      email,
      role,
      department,
      salary,
      joinDate,
      status,
      projects,
      lastActive,
    };
  });
}
