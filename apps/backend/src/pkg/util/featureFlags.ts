import { eq, and } from "drizzle-orm";
import { featureFlags, userFeatureFlags, organizationFeatureFlags, db } from "@repo/db";

/**
 * Check if a feature flag is enabled for a specific user
 * @param userId - The user ID to check
 * @param flagName - The name of the feature flag
 * @param organizationId - The organization ID to check (optional)
 * @returns Promise<boolean> - Whether the flag is enabled for the user
 */
export async function isFlagEnabled(userId: string | null | undefined, flagName: string, organizationId?: string | null): Promise<boolean> {
  try {
    // First, get the feature flag details
    const flag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.name, flagName))
      .limit(1);
    
    if (!flag[0]) {
      // Flag doesn't exist, return false
      return false;
    }
    
    // Check if user has a specific override
    const userFlag = userId ? await db
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, userId),
          eq(userFeatureFlags.featureFlagId, flag[0].id)
        )
      )
      .limit(1) : [];
    
    if (userFlag[0]) {
      // User has a specific setting, use it
      return userFlag[0].enabled;
    }
    
    // Check if organization has a specific override
    const orgFlag = organizationId ? await db
      .select()
      .from(organizationFeatureFlags)
      .where(
        and(
          eq(organizationFeatureFlags.organizationId, organizationId),
          eq(organizationFeatureFlags.featureFlagId, flag[0].id)
        )
      )
      .limit(1) : [];
    
    if (orgFlag[0]) {
      // Organization has a specific setting, use it
      return orgFlag[0].enabled;
    }
    
    // No user or organization-specific setting, fall back to default
    return flag[0].defaultState;
  } catch (error) {
    console.error(`Error checking feature flag ${flagName} for user ${userId}:`, error);
    // On error, return false (safe default)
    return false;
  }
}

/**
 * Get all feature flags for a user with their current state
 * @param userId - The user ID to get flags for
 * @param organizationId - The organization ID to check (optional)
 * @returns Promise<Array<{name: string, enabled: boolean, description: string}>>
 */
export async function getUserFeatureFlags(userId: string | null | undefined, organizationId?: string | null): Promise<Array<{
  name: string;
  enabled: boolean;
  description: string;
}>> {
  try {
    // Get all feature flags
    const allFlags = await db
      .select()
      .from(featureFlags);
    
    // Get user-specific overrides
    const userFlags = userId ? await db
      .select()
      .from(userFeatureFlags)
      .where(eq(userFeatureFlags.userId, userId)) : [];
    
    // Get organization-specific overrides
    const orgFlags = organizationId ? await db
      .select()
      .from(organizationFeatureFlags)
      .where(eq(organizationFeatureFlags.organizationId, organizationId)) : [];
    
    // Create maps of user and organization flag overrides
    const userFlagMap = new Map(
      userFlags.map(uf => [uf.featureFlagId, uf.enabled])
    );
    const orgFlagMap = new Map(
      orgFlags.map(of => [of.featureFlagId, of.enabled])
    );
    
    // Return all flags with their effective state
    // Priority: user override > organization override > default
    return allFlags.map(flag => ({
      name: flag.name,
      enabled: userFlagMap.has(flag.id) 
        ? userFlagMap.get(flag.id)! 
        : orgFlagMap.has(flag.id) 
          ? orgFlagMap.get(flag.id)! 
          : flag.defaultState,
      description: flag.description
    }));
  } catch (error) {
    console.error(`Error getting feature flags for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get all feature flags for a user as a map for efficient lookup
 * @param userId - The user ID to get flags for
 * @param organizationId - The organization ID to check (optional)
 * @returns Promise<Map<string, boolean>> - Map of flag name to enabled state
 */
export async function getUserFeatureFlagsMap(userId: string | null | undefined, organizationId?: string | null): Promise<Map<string, boolean>> {
  try {
    const flags = await getUserFeatureFlags(userId, organizationId);
    return new Map(flags.map(flag => [flag.name, flag.enabled]));
  } catch (error) {
    console.error(`Error getting feature flags map for user ${userId}:`, error);
    return new Map();
  }
}

/**
 * Get detailed flag state information for an organization or all flags (if no organization)
 * @param organizationId - The organization ID to get flag states for (optional)
 * @param userId - The user ID to check for user-level overrides (optional)
 * @returns Promise<Array<{id: string, name: string, description: string, defaultState: boolean, organizationOverride: boolean | null, userOverride: boolean | null, effectiveState: boolean}>>
 */
export async function getFlagState(
  organizationId?: string | null, 
  userId?: string | null
): Promise<Array<{
  id: string;
  name: string;
  description: string;
  defaultState: boolean;
  organizationOverride: boolean | null;
  userOverride: boolean | null;
  effectiveState: boolean;
}>> {
  try {
    // Get all feature flags
    const allFlags = await db
      .select()
      .from(featureFlags);
    
    // Get organization-specific overrides (if organizationId provided)
    const orgFlags = organizationId ? await db
      .select()
      .from(organizationFeatureFlags)
      .where(eq(organizationFeatureFlags.organizationId, organizationId)) : [];
    
    // Get user-specific overrides (if userId provided)
    const userFlags = userId ? await db
      .select()
      .from(userFeatureFlags)
      .where(eq(userFeatureFlags.userId, userId)) : [];
    
    // Create maps for efficient lookup
    const orgFlagMap = new Map(
      orgFlags.map(of => [of.featureFlagId, of.enabled])
    );
    const userFlagMap = new Map(
      userFlags.map(uf => [uf.featureFlagId, uf.enabled])
    );
    
    // Return detailed flag information
    return allFlags.map(flag => {
      const organizationOverride = orgFlagMap.get(flag.id) ?? null;
      const userOverride = userFlagMap.get(flag.id) ?? null;
      
      // Determine effective state: user override > organization override > default
      const effectiveState = userOverride !== null 
        ? userOverride 
        : organizationOverride !== null 
          ? organizationOverride 
          : flag.defaultState;
      
      return {
        id: flag.id,
        name: flag.name,
        description: flag.description,
        defaultState: flag.defaultState,
        organizationOverride,
        userOverride,
        effectiveState
      };
    });
  } catch (error) {
    console.error(`Error getting flag state:`, error);
    return [];
  }
}

/**
 * Set a feature flag at the specified level (admin function)
 * @param flagId - The ID of the feature flag
 * @param enabled - Whether to enable or disable the flag
 * @param level - The level to set the flag at: "user", "organization", or "default"
 * @param userId - The user ID (required for user level)
 * @param organizationId - The organization ID (required for organization level)
 * @returns Promise<boolean> - Success status
 */
export async function setFlag(
  flagId: string,
  enabled: boolean,
  level: "user" | "organization" | "default",
  userId?: string,
  organizationId?: string
): Promise<boolean> {
  try {
    // Get the feature flag
    const flag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);
    
    if (!flag[0]) {
      throw new Error(`Feature flag with ID '${flagId}' not found`);
    }

    switch (level) {
      case "user":
        if (!userId) {
          throw new Error("User ID is required for user-level flag setting");
        }
        return await setUserFeatureFlagById(userId, flagId, enabled);
      
      case "organization":
        if (!organizationId) {
          throw new Error("Organization ID is required for organization-level flag setting");
        }
        return await setOrganizationFeatureFlagById(organizationId, flagId, enabled);
      
      case "default":
        await db
          .update(featureFlags)
          .set({ defaultState: enabled, updatedAt: new Date() })
          .where(eq(featureFlags.id, flagId));
        return true;
      
      default:
        throw new Error(`Invalid level: ${level}`);
    }
  } catch (error) {
    console.error(`Error setting feature flag ${flagId} at ${level} level:`, error);
    return false;
  }
}

/**
 * Remove a user-specific feature flag override (admin function)
 * @param flagId - The ID of the feature flag
 * @param userId - The user ID to remove the flag for
 * @returns Promise<boolean> - Success status
 */
export async function removeUserFlag(flagId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, userId),
          eq(userFeatureFlags.featureFlagId, flagId)
        )
      );
    
    return true;
  } catch (error) {
    console.error(`Error removing user flag ${flagId} for user ${userId}:`, error);
    return false;
  }
}

/**
 * Remove an organization-specific feature flag override (admin function)
 * @param flagId - The ID of the feature flag
 * @param organizationId - The organization ID to remove the flag for
 * @returns Promise<boolean> - Success status
 */
export async function removeOrganizationFlag(flagId: string, organizationId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(organizationFeatureFlags)
      .where(
        and(
          eq(organizationFeatureFlags.organizationId, organizationId),
          eq(organizationFeatureFlags.featureFlagId, flagId)
        )
      );
    
    return true;
  } catch (error) {
    console.error(`Error removing organization flag ${flagId} for organization ${organizationId}:`, error);
    return false;
  }
}

/**
 * Helper function to set user feature flag by ID
 * @param userId - The user ID to set the flag for
 * @param flagId - The feature flag ID
 * @param enabled - Whether to enable or disable the flag
 * @returns Promise<boolean> - Success status
 */
async function setUserFeatureFlagById(userId: string, flagId: string, enabled: boolean): Promise<boolean> {
  try {
    // Check if user already has this flag set
    const existingUserFlag = await db
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, userId),
          eq(userFeatureFlags.featureFlagId, flagId)
        )
      )
      .limit(1);
    
    if (existingUserFlag[0]) {
      // Update existing user flag
      await db
        .update(userFeatureFlags)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(userFeatureFlags.id, existingUserFlag[0].id));
    } else {
      // Create new user flag
      await db
        .insert(userFeatureFlags)
        .values({
          id: crypto.randomUUID(),
          userId,
          featureFlagId: flagId,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting feature flag ${flagId} for user ${userId}:`, error);
    return false;
  }
}

/**
 * Helper function to set organization feature flag by ID
 * @param organizationId - The organization ID to set the flag for
 * @param flagId - The feature flag ID
 * @param enabled - Whether to enable or disable the flag
 * @returns Promise<boolean> - Success status
 */
async function setOrganizationFeatureFlagById(organizationId: string, flagId: string, enabled: boolean): Promise<boolean> {
  try {
    // Check if organization already has this flag set
    const existingOrgFlag = await db
      .select()
      .from(organizationFeatureFlags)
      .where(
        and(
          eq(organizationFeatureFlags.organizationId, organizationId),
          eq(organizationFeatureFlags.featureFlagId, flagId)
        )
      )
      .limit(1);
    
    if (existingOrgFlag[0]) {
      // Update existing organization flag
      await db
        .update(organizationFeatureFlags)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(organizationFeatureFlags.id, existingOrgFlag[0].id));
    } else {
      // Create new organization flag
      await db
        .insert(organizationFeatureFlags)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          featureFlagId: flagId,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting feature flag ${flagId} for organization ${organizationId}:`, error);
    return false;
  }
}