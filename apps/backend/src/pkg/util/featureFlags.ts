import { eq, and } from "drizzle-orm";
import { featureFlags, userFeatureFlags, db } from "@repo/db";

/**
 * Check if a feature flag is enabled for a specific user
 * @param userId - The user ID to check
 * @param flagName - The name of the feature flag
 * @returns Promise<boolean> - Whether the flag is enabled for the user
 */
export async function isFlagEnabled(userId: string, flagName: string): Promise<boolean> {
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
    const userFlag = await db
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, userId),
          eq(userFeatureFlags.featureFlagId, flag[0].id)
        )
      )
      .limit(1);
    
    if (userFlag[0]) {
      // User has a specific setting, use it
      return userFlag[0].enabled;
    }
    
    // No user-specific setting, fall back to default
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
 * @returns Promise<Array<{name: string, enabled: boolean, description: string}>>
 */
export async function getUserFeatureFlags(userId: string): Promise<Array<{
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
    const userFlags = await db
      .select()
      .from(userFeatureFlags)
      .where(eq(userFeatureFlags.userId, userId));
    
    // Create a map of user flag overrides
    const userFlagMap = new Map(
      userFlags.map(uf => [uf.featureFlagId, uf.enabled])
    );
    
    // Return all flags with their effective state
    return allFlags.map(flag => ({
      name: flag.name,
      enabled: userFlagMap.has(flag.id) ? userFlagMap.get(flag.id)! : flag.defaultState,
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
 * @returns Promise<Map<string, boolean>> - Map of flag name to enabled state
 */
export async function getUserFeatureFlagsMap(userId: string): Promise<Map<string, boolean>> {
  try {
    const flags = await getUserFeatureFlags(userId);
    return new Map(flags.map(flag => [flag.name, flag.enabled]));
  } catch (error) {
    console.error(`Error getting feature flags map for user ${userId}:`, error);
    return new Map();
  }
}

/**
 * Set a feature flag for a specific user (admin function)
 * @param adminUserId - The admin user ID making the change
 * @param targetUserId - The user ID to set the flag for
 * @param flagName - The name of the feature flag
 * @param enabled - Whether to enable or disable the flag
 * @returns Promise<boolean> - Success status
 */
export async function setUserFeatureFlag(
  adminUserId: string, 
  targetUserId: string, 
  flagName: string, 
  enabled: boolean
): Promise<boolean> {
  try {
    // Get the feature flag
    const flag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.name, flagName))
      .limit(1);
    
    if (!flag[0]) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }
    
    // Check if user already has this flag set
    const existingUserFlag = await db
      .select()
      .from(userFeatureFlags)
      .where(
        and(
          eq(userFeatureFlags.userId, targetUserId),
          eq(userFeatureFlags.featureFlagId, flag[0].id)
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
          userId: targetUserId,
          featureFlagId: flag[0].id,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting feature flag ${flagName} for user ${targetUserId}:`, error);
    return false;
  }
}