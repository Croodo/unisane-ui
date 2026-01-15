import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { defineOpMeta, withMeta } from "./meta";
import {
  ZPasswordSignin,
  ZPasswordSignup,
  ZOtpStart,
  ZOtpVerify,
  ZResetStart,
  ZResetVerify,
  ZTokenExchange,
  ZPhoneStart,
  ZPhoneVerify,
} from "@unisane/auth/client";

const c = initContract();

export const authContract = c.router({
  passwordSignUp: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/password/signup",
      body: ZPasswordSignup,
      responses: {
        200: z.object({ ok: z.literal(true), token: z.string().optional() }),
      },
      summary: "Password signup",
      description:
        "Create a new user account using email and password. Returns a JWT token on success. " +
        "Rate limited by email hash to prevent abuse. The token can be used for subsequent authenticated requests.",
    },
    defineOpMeta({
      op: "auth.password.signup",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "signup",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZPasswordSignup",
        },
        raw: true,
        rateKeyExpr:
          "['-', sha256Hex(body.email), 'auth.password.signup'].join(':')",
        extraImports: [
          { importPath: "@unisane/kernel", names: ["sha256Hex"] },
        ],
        factory: {
          importPath: "@unisane/auth",
          name: "signupFactory",
        },
      },
    })
  ),
  passwordSignIn: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/password/signin",
      body: ZPasswordSignin,
      responses: {
        200: z.object({ ok: z.literal(true), token: z.string().optional() }),
      },
      summary: "Password signin",
      description:
        "Authenticate an existing user with email and password. Returns a JWT token on success. " +
        "Rate limited by email hash to prevent brute force attacks.",
    },
    defineOpMeta({
      op: "auth.password.signin",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "signin",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZPasswordSignin",
        },
        raw: true,
        rateKeyExpr:
          "['-', sha256Hex(body.email), 'auth.password.signin'].join(':')",
        extraImports: [
          { importPath: "@unisane/kernel", names: ["sha256Hex"] },
        ],
        factory: {
          importPath: "@unisane/auth",
          name: "signinFactory",
        },
      },
    })
  ),
  resetStart: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/password/reset/start",
      body: ZResetStart,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ sent: z.boolean() }),
        }),
      },
      summary: "Password reset start",
      description:
        "Initiate password reset flow by sending a reset link to the user's email. " +
        "Always returns success to prevent email enumeration attacks.",
    },
    defineOpMeta({
      op: "auth.password.reset.start",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "resetStart",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZResetStart",
        },
        raw: true,
        rateKeyExpr:
          "['-', sha256Hex(body.email), 'auth.password.reset.start'].join(':')",
        extraImports: [
          { importPath: "@unisane/kernel", names: ["sha256Hex"] },
        ],
        factory: {
          importPath: "@unisane/auth",
          name: "resetStartFactory",
        },
      },
    })
  ),
  resetVerify: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/password/reset/verify",
      body: ZResetVerify,
      responses: {
        200: z.object({ ok: z.literal(true), token: z.string().optional() }),
      },
      summary: "Password reset verify",
      description:
        "Complete password reset by verifying the reset token and setting a new password. " +
        "Returns a JWT token on success, allowing immediate login.",
    },
    defineOpMeta({
      op: "auth.password.reset.verify",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "resetVerify",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZResetVerify",
        },
        raw: true,
        rateKeyExpr:
          "['-', sha256Hex(body.email), 'auth.password.reset.verify'].join(':')",
        extraImports: [
          { importPath: "@unisane/kernel", names: ["sha256Hex"] },
        ],
        factory: {
          importPath: "@unisane/auth",
          name: "resetVerifyFactory",
        },
      },
    })
  ),
  otpStart: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/otp/start",
      body: ZOtpStart,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ sent: z.boolean() }),
        }),
      },
      summary: "OTP start",
      description:
        "Start passwordless authentication by sending a one-time password (OTP) to the user's email. " +
        "The OTP is valid for a limited time and can be verified with the OTP verify endpoint.",
    },
    defineOpMeta({
      op: "auth.otp.start",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "otpStart",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZOtpStart",
        },
        raw: true,
        rateKeyExpr: "['-', sha256Hex(body.email), 'auth.otp.start'].join(':')",
        extraImports: [
          { importPath: "@unisane/kernel", names: ["sha256Hex"] },
        ],
        factory: {
          importPath: "@unisane/auth",
          name: "otpStartFactory",
        },
      },
    })
  ),
  otpVerify: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/otp/verify",
      body: ZOtpVerify,
      responses: {
        200: z.object({ ok: z.literal(true), token: z.string().optional() }),
      },
      summary: "OTP verify",
      description:
        "Complete passwordless authentication by verifying the OTP sent to the user's email. " +
        "Returns a JWT token on success. Creates a new user account if one doesn't exist.",
    },
    defineOpMeta({
      op: "auth.otp.verify",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "otpVerify",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZOtpVerify",
        },
        raw: true,
        rateKeyExpr:
          "['-', sha256Hex(body.email), 'auth.otp.verify'].join(':')",
        extraImports: [
          { importPath: "@unisane/kernel", names: ["sha256Hex"] },
        ],
        factory: {
          importPath: "@unisane/auth",
          name: "otpVerifyFactory",
        },
      },
    })
  ),
  phoneStart: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/phone/start",
      body: ZPhoneStart,
      responses: { 200: z.object({ ok: z.literal(true), data: z.object({ sent: z.boolean() }) }) },
      summary: "Start phone verification",
      description:
        "Send a verification code to the user's phone number via SMS. " +
        "Requires authentication. Used to verify phone number ownership for account security.",
    },
    defineOpMeta({
      op: "auth.phone.start",
      requireUser: true,
      service: {
        importPath: "@unisane/auth",
        fn: "phoneStart",
        zodBody: { importPath: "@unisane/auth", name: "ZPhoneStart" },
        invoke: 'object',
        callArgs: [ { name: 'userId', from: 'ctx', key: 'userId' }, { name: 'phone', from: 'body', key: 'phone' } ],
      },
    })
  ),
  phoneVerify: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/auth/phone/verify",
      body: ZPhoneVerify,
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Verify phone code",
      description:
        "Verify the SMS code sent to the user's phone. " +
        "Requires authentication. Marks the phone number as verified on the user's account.",
    },
    defineOpMeta({
      op: "auth.phone.verify",
      requireUser: true,
      service: {
        importPath: "@unisane/auth",
        fn: "phoneVerify",
        zodBody: { importPath: "@unisane/auth", name: "ZPhoneVerify" },
        invoke: 'object',
        callArgs: [ { name: 'userId', from: 'ctx', key: 'userId' }, { name: 'phone', from: 'body', key: 'phone' }, { name: 'code', from: 'body', key: 'code' } ],
      },
    })
  ),
  signOut: withMeta(
    {
      method: "POST",
      path: "/api/auth/signout",
      body: z.object({}).optional(),
      responses: { 200: z.object({ ok: z.literal(true) }) },
      summary: "Sign out",
      description:
        "Sign out the current user by clearing authentication cookies and invalidating the session. " +
        "Works for both JWT and cookie-based authentication.",
    },
    defineOpMeta({
      op: "auth.signOut",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "signOut",
        raw: true,
        factory: {
          importPath: "@unisane/auth",
          name: "signoutFactory",
        },
      },
    })
  ),
  tokenExchange: withMeta(
    {
      method: "POST",
      path: "/api/auth/token/exchange",
      body: ZTokenExchange,
      responses: {
        200: z.object({ ok: z.literal(true), token: z.string().optional() }),
      },
      summary: "Provider token exchange",
      description:
        "Exchange an OAuth provider token (Google, GitHub, etc.) for a SaaSKit JWT token. " +
        "Used after OAuth redirect to complete the authentication flow. Rate limited by IP address.",
    },
    defineOpMeta({
      op: "auth.token.exchange",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "exchange",
        zodBody: {
          importPath: "@unisane/auth",
          name: "ZTokenExchange",
        },
        raw: true,
        rateKeyExpr:
          "(() => { const xfwd = req.headers.get('x-forwarded-for') ?? ''; const ip = xfwd.split(',')[0]?.trim() || (req.headers.get('x-real-ip') ?? '-'); return ['-', ip, 'auth.token.exchange'].join(':'); })()",
        factory: {
          importPath: "@unisane/auth",
          name: "tokenExchangeFactory",
        },
      },
    })
  ),
  csrf: withMeta(
    {
      method: "GET",
      path: "/api/auth/csrf",
      responses: { 200: z.object({ ok: z.literal(true), token: z.string() }) },
      summary: "Get CSRF token and cookie",
      description:
        "Retrieve a CSRF token for cookie-authenticated requests. " +
        "The token must be sent in the x-csrf-token header for state-changing requests when using cookie auth. " +
        "Bearer token and API key authentication do not require CSRF tokens.",
    },
    defineOpMeta({
      op: "auth.csrf",
      allowUnauthed: true,
      service: {
        importPath: "@unisane/auth",
        fn: "getCsrf",
        raw: true,
        rateKeyExpr:
          "(() => { const xfwd = req.headers.get('x-forwarded-for') ?? ''; const ip = xfwd.split(',')[0]?.trim() || (req.headers.get('x-real-ip') ?? '-'); return ['-', ip, 'auth.csrf'].join(':'); })()",
        factory: {
          importPath: "@unisane/auth",
          name: "csrfFactory",
        },
      },
    })
  ),
});
