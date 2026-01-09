import type {
  MembershipsApi,
  UsersApi,
} from "./types";

export interface IdentityRepo {
  memberships: MembershipsApi;
  users: UsersApi;
}
