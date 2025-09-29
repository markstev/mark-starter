// From: https://github.com/honojs/middleware/blob/main/packages/clerk-auth/src/index.ts
import { createClerkClient } from "@clerk/backend";
import type { ClerkClient, ClerkOptions } from "@clerk/backend";
import type { Context, MiddlewareHandler } from "hono";
import { env } from "hono/adapter";

type ClerkAuth = ReturnType<Awaited<ReturnType<ClerkClient["authenticateRequest"]>>["toAuth"]>;

declare module "hono" {
  interface ContextVariableMap {
    clerk: ClerkClient;
    clerkAuth: ClerkAuth;
  }
}

export const getAuth = (c: Context) => {
  const clerkAuth = c.get("clerkAuth");
  return clerkAuth;
};

export const getUserId = (c: Context) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return auth.userId;
};

export const getUserAndOrgId = (c: Context) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return {
    userId: auth.userId,
    orgId: auth.orgId || null,
  };
};

export const getUserAndOrgIdOrNull = (c: Context) => {
  const auth = getAuth(c);
  return {
    userId: auth?.userId || null,
    orgId: auth?.orgId || null,
  };
};

type ClerkEnv = {
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_API_URL: string;
  CLERK_API_VERSION: string;
};

export const auth = (options?: ClerkOptions): MiddlewareHandler => {
  return async (c, next) => {
    const clerkEnv = env<ClerkEnv>(c);
    const { secretKey, publishableKey, apiUrl, apiVersion, ...rest } = options || {
      secretKey: clerkEnv.CLERK_SECRET_KEY || "",
      publishableKey: clerkEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
      apiUrl: clerkEnv.CLERK_API_URL,
      apiVersion: clerkEnv.CLERK_API_VERSION,
    };
    if (!secretKey) {
      throw new Error("Missing Clerk Secret key");
    }

    if (!publishableKey) {
      throw new Error("Missing Clerk Publishable key");
    }

    const clerkClient = createClerkClient({
      ...rest,
      apiUrl,
      apiVersion,
      secretKey,
      publishableKey,
    });

    const requestState = await clerkClient.authenticateRequest(c.req.raw, {
      ...rest,
      secretKey,
      publishableKey,
    });

    if (requestState.headers) {
      requestState.headers.forEach((value, key) => c.res.headers.append(key, value));

      const locationHeader = requestState.headers.get("location");

      if (locationHeader) {
        return c.redirect(locationHeader, 307);
      } else if (requestState.status === "handshake") {
        throw new Error("Clerk: unexpected handshake without redirect");
      }
    }

    c.set("clerkAuth", requestState.toAuth());
    c.set("clerk", clerkClient);

    await next();
  };
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.text("Unauthorized", 401);
  }
  await next();
};

export const requireStaffAdmin: MiddlewareHandler = async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.text("Unauthorized", 401);
  }

  // Get the clerk client to fetch user data
  const clerkClient = c.get("clerk");
  if (!clerkClient) {
    return c.text("Internal Server Error", 500);
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const isStaffAdmin = user.publicMetadata?.is_staff_admin === true;
    
    if (!isStaffAdmin) {
      return c.text("Forbidden: Staff admin access required", 403);
    }
  } catch (error) {
    console.error("Error checking staff admin status:", error);
    return c.text("Internal Server Error", 500);
  }

  await next();
};

// Helper function to check if user is staff admin (for use in TRPC procedures)
export const isStaffAdmin = async (c: Context): Promise<boolean> => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return false;
  }

  const clerkClient = c.get("clerk");
  if (!clerkClient) {
    return false;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    return user.publicMetadata?.is_staff_admin === true;
  } catch (error) {
    console.error("Error checking staff admin status:", error);
    return false;
  }
};