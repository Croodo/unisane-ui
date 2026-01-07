import { usersRepository } from "../../data/users.repository";

export async function usersFacets() {
  const { total, facets } = await usersRepository.stats({});

  const roles = facets.globalRole ?? {};
  const withRole = Object.values(roles).reduce((a, b) => a + b, 0);
  const withoutRole = total - withRole;

  return {
    hasRole: {
      withRole,
      withoutRole,
    },
    roles,
  };
}
