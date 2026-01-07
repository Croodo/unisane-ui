import { getEnv } from "@unisane/kernel";
import { signup } from "./signup";
import { makeAuthHandler } from "./make-auth-handler";

export const signupFactory = makeAuthHandler({
  checkEnabled: () => getEnv().AUTH_PASSWORD_ENABLED ?? false,
  disabledMessage: "Password auth disabled",
  handler: signup,
});
