import { getEnv } from "@unisane/kernel";
import { signin } from "./signin";
import { makeAuthHandler } from "./make-auth-handler";

export const signinFactory = makeAuthHandler({
  checkEnabled: () => getEnv().AUTH_PASSWORD_ENABLED ?? false,
  disabledMessage: "Password auth disabled",
  handler: signin,
});
