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
} from "@unisane/auth";

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
