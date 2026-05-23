import { vi, test, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// createSession
test("createSession sets auth-token cookie with correct options", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.secure).toBe(false); // NODE_ENV is not "production" in tests
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession token encodes userId and email", async () => {
  const { createSession } = await import("@/lib/auth");
  const { jwtVerify } = await import("jose");

  await createSession("user-42", "hello@example.com");

  const token = mockCookieStore.set.mock.calls[0][1] as string;
  const { payload } = await jwtVerify(token, SECRET);
  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession sets cookie expiry ~7 days from now", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();

  await createSession("user-1", "user@example.com");

  const after = Date.now();
  const expires: Date = mockCookieStore.set.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession sets expiresAt in the JWT payload", async () => {
  const { createSession } = await import("@/lib/auth");
  const { jwtVerify } = await import("jose");
  const before = Date.now();

  await createSession("user-1", "user@example.com");

  const token = mockCookieStore.set.mock.calls[0][1] as string;
  const { payload } = await jwtVerify(token, SECRET);
  const expiresAt = new Date(payload.expiresAt as string).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
});

test("createSession sets secure=true when NODE_ENV is production", async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  vi.resetModules();

  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.secure).toBe(true);

  process.env.NODE_ENV = original;
  vi.resetModules();
});

// getSession
test("getSession returns null when cookie is absent", async () => {
  mockCookieStore.get.mockReturnValue(undefined);
  const { getSession } = await import("@/lib/auth");

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await makeToken({ userId: "u1", email: "a@b.com", expiresAt });
  mockCookieStore.get.mockReturnValue({ value: token });
  const { getSession } = await import("@/lib/auth");

  const session = await getSession();

  expect(session?.userId).toBe("u1");
  expect(session?.email).toBe("a@b.com");
  expect(new Date(session?.expiresAt as string).getTime()).toBeCloseTo(expiresAt.getTime(), -3);
});

test("getSession returns null when cookie value is an empty string", async () => {
  mockCookieStore.get.mockReturnValue({ value: "" });
  const { getSession } = await import("@/lib/auth");

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns null when token is signed with wrong secret", async () => {
  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "u1", email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);
  mockCookieStore.get.mockReturnValue({ value: token });
  const { getSession } = await import("@/lib/auth");

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken({ userId: "u1", email: "a@b.com" }, "-1s");
  mockCookieStore.get.mockReturnValue({ value: token });
  const { getSession } = await import("@/lib/auth");

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns null for a malformed token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.jwt" });
  const { getSession } = await import("@/lib/auth");

  const result = await getSession();

  expect(result).toBeNull();
});

// deleteSession
test("deleteSession removes the auth-token cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

// verifySession
test("verifySession returns null when request has no cookie", async () => {
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/");

  const result = await verifySession(request);

  expect(result).toBeNull();
});

test("verifySession returns session payload for valid cookie in request", async () => {
  const token = await makeToken({ userId: "u2", email: "x@y.com", expiresAt: new Date() });
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${token}` },
  });

  const session = await verifySession(request);

  expect(session?.userId).toBe("u2");
  expect(session?.email).toBe("x@y.com");
});

test("verifySession returns null for expired token in request", async () => {
  const token = await makeToken({ userId: "u2", email: "x@y.com" }, "-1s");
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${token}` },
  });

  const result = await verifySession(request);

  expect(result).toBeNull();
});

test("verifySession returns null for malformed token in request", async () => {
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: "auth-token=garbage" },
  });

  const result = await verifySession(request);

  expect(result).toBeNull();
});
