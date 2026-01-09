import { resetVerify } from "./resetVerify";
import { makeAuthHandler } from "./make-auth-handler";

export const resetVerifyFactory = makeAuthHandler({
  handler: resetVerify,
});
