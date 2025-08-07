import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

// Define the structure of accessible resources
export interface AccessibleResources {
  user_id: string;
  report_ids?: string[];
  report_template_ids?: string[];
  tenant_ids?: string[];
  // Add more resource types as needed
}

// Schema for validating the JWT payload
const AccessTokenSchema = z.object({
  user_id: z.string(),
  report_ids: z.array(z.string()).optional(),
  report_template_ids: z.array(z.string()).optional(),
  tenant_ids: z.array(z.string()).optional(),
  exp: z.number(),
  iat: z.number(),
  iss: z.string(),
});

export type AccessTokenPayload = z.infer<typeof AccessTokenSchema>;

// Get the JWT secret from environment variables
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
};

// Builder pattern for creating access tokens
export class AccessTokenBuilder {
  private payload: Partial<AccessibleResources> = {};

  withUserId(userId: string): AccessTokenBuilder {
    this.payload.user_id = userId;
    return this;
  }

  withReport(reportId: string): AccessTokenBuilder {
    if (!this.payload.report_ids) {
      this.payload.report_ids = [];
    }
    this.payload.report_ids.push(reportId);
    return this;
  }

  withReports(reportIds: string[]): AccessTokenBuilder {
    this.payload.report_ids = reportIds;
    return this;
  }

  withReportTemplate(reportTemplateId: string): AccessTokenBuilder {
    if (!this.payload.report_template_ids) {
      this.payload.report_template_ids = [];
    }
    this.payload.report_template_ids.push(reportTemplateId);
    return this;
  }

  withReportTemplates(reportTemplateIds: string[]): AccessTokenBuilder {
    this.payload.report_template_ids = reportTemplateIds;
    return this;
  }

  withTenant(tenantId: string): AccessTokenBuilder {
    if (!this.payload.tenant_ids) {
      this.payload.tenant_ids = [];
    }
    this.payload.tenant_ids.push(tenantId);
    return this;
  }

  withTenants(tenantIds: string[]): AccessTokenBuilder {
    this.payload.tenant_ids = tenantIds;
    return this;
  }

  async build(ttlSeconds: number = 86400): Promise<string> {
    if (!this.payload.user_id) {
      throw new Error("user_id is required");
    }

    const secret = getJwtSecret();
    
    // Calculate expiration time
    const now = Math.floor(Date.now() / 1000);
    
    const jwt = await new SignJWT({
      ...this.payload,
      iss: "sdr-access-token",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + ttlSeconds)
      .sign(secret);

    return jwt;
  }
}


// Function to unpack and verify access tokens
export async function unpackAccessToken(token: string): Promise<AccessibleResources> {
  try {
    const secret = getJwtSecret();
    
    const { payload } = await jwtVerify(token, secret, {
      issuer: "sdr-access-token",
    });

    // Validate the payload structure
    const validatedPayload = AccessTokenSchema.parse(payload);
    
    // Return the accessible resources
    return {
      user_id: validatedPayload.user_id,
      report_ids: validatedPayload.report_ids,
      report_template_ids: validatedPayload.report_template_ids,
      tenant_ids: validatedPayload.tenant_ids,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid token payload: ${error.message}`);
    }
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// // Middleware for Hono to verify access tokens
// export const verifyAccessToken = async (token: string): Promise<AccessibleResources> => {
//   if (!token) {
//     throw new Error("Access token is required");
//   }

//   // Remove 'Bearer ' prefix if present
//   const cleanToken = token.replace(/^Bearer\s+/, "");
  
//   return await unpackAccessToken(cleanToken);
// };

// Helper function to check if user has access to a specific resource
export function hasAccessToReport(resources: AccessibleResources, reportId: string): boolean {
  return resources.report_ids?.includes(reportId) ?? false;
}

export function hasAccessToReportTemplate(resources: AccessibleResources, reportTemplateId: string): boolean {
  return resources.report_template_ids?.includes(reportTemplateId) ?? false;
}

export function hasAccessToTenant(resources: AccessibleResources, tenantId: string): boolean {
  return resources.tenant_ids?.includes(tenantId) ?? false;
}

// Export the builder function for easier usage
export const createAccessToken = () => new AccessTokenBuilder();
