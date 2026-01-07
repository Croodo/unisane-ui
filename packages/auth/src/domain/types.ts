export type ExchangeInput = { provider: string; token: string };
export type ExchangeResult = { userId: string };

export type AuthCredentialView = {
  id: string;
  userId: string;
  emailNorm: string;
  algo: "scrypt";
  salt: string;
  hash: string;
  passwordChangedAt?: Date;
  failedLogins?: number;
  lockedUntil?: Date | null;
};
