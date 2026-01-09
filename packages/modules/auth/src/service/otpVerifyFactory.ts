import { otpVerify } from "./otpVerify";
import { makeAuthHandler } from "./make-auth-handler";

export const otpVerifyFactory = makeAuthHandler({
  handler: otpVerify,
});
