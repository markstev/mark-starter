import { db, featureFlags } from "@repo/db";
import { eq } from "drizzle-orm";
import { newId } from "@repo/id";

// Feature flags configuration
const FEATURE_FLAGS_CONFIG = [
  {
    name: "dev_pages",
    description: "Enable dev pages",
    default: false,
  },
] as const;

type FeatureFlagConfig = typeof FEATURE_FLAGS_CONFIG[number];

/**
 * Apply feature flags configuration to the database
 * Creates new flags and updates existing ones based on the configuration
 */
export async function applyFeatureFlags() {
  console.log("🚀 Starting feature flags application...");
  
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const flagConfig of FEATURE_FLAGS_CONFIG) {
    try {
      // Check if flag already exists
      const existingFlag = await db
        .select()
        .from(featureFlags)
        .where(eq(featureFlags.name, flagConfig.name))
        .limit(1);

      if (existingFlag.length === 0) {
        // Create new flag
        await db.insert(featureFlags).values({
          id: newId("featureFlag"),
          name: flagConfig.name,
          description: flagConfig.description,
          defaultState: flagConfig.default,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`✅ Created feature flag: ${flagConfig.name}`);
        createdCount++;
      } else {
        // Update existing flag
        const existing = existingFlag[0]!;
        
        // Only update if description or default state has changed
        if (
          existing.description !== flagConfig.description ||
          existing.defaultState !== flagConfig.default
        ) {
          await db
            .update(featureFlags)
            .set({
              description: flagConfig.description,
              defaultState: flagConfig.default,
              updatedAt: new Date(),
            })
            .where(eq(featureFlags.id, existing.id));
          
          console.log(`🔄 Updated feature flag: ${flagConfig.name}`);
          updatedCount++;
        } else {
          console.log(`⏭️  No changes needed for: ${flagConfig.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing feature flag ${flagConfig.name}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log("\n📊 Feature Flags Application Summary:");
  console.log(`✅ Created: ${createdCount} flags`);
  console.log(`�� Updated: ${updatedCount} flags`);
  console.log(`❌ Errors: ${errorCount} flags`);
  console.log(`📋 Total processed: ${FEATURE_FLAGS_CONFIG.length} flags`);

  if (errorCount > 0) {
    console.log("\n⚠️  Some flags encountered errors. Check the logs above for details.");
  } else {
    console.log("\n🎉 All feature flags processed successfully!");
  }

  return {
    created: createdCount,
    updated: updatedCount,
    errors: errorCount,
    total: FEATURE_FLAGS_CONFIG.length,
  };
}

/**
 * Get all feature flags from the database
 * Useful for verification and debugging
 */
export async function getAllFeatureFlags() {
  try {
    const flags = await db.select().from(featureFlags).orderBy(featureFlags.name);
    
    console.log("\n📋 Current Feature Flags in Database:");
    flags.forEach(flag => {
      console.log(`  • ${flag.name}: ${flag.description} (default: ${flag.defaultState})`);
    });
    
    return flags;
  } catch (error) {
    console.error("❌ Error fetching feature flags:", error);
    throw error;
  }
}

/**
 * Reset feature flags to their default configuration
 * This will update all flags to match the configuration above
 */
export async function resetFeatureFlags() {
  console.log("🔄 Resetting feature flags to default configuration...");
  
  // First, get all existing flags
  const existingFlags = await db.select().from(featureFlags);
  
  let resetCount = 0;
  let errorCount = 0;

  for (const flagConfig of FEATURE_FLAGS_CONFIG) {
    try {
      const existingFlag = existingFlags.find(f => f.name === flagConfig.name);
      
      if (existingFlag) {
        await db
          .update(featureFlags)
          .set({
            description: flagConfig.description,
            defaultState: flagConfig.default,
            updatedAt: new Date(),
          })
          .where(eq(featureFlags.id, existingFlag.id));
        
        console.log(`�� Reset feature flag: ${flagConfig.name}`);
        resetCount++;
      }
    } catch (error) {
      console.error(`❌ Error resetting feature flag ${flagConfig.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Reset Summary: ${resetCount} flags reset, ${errorCount} errors`);
  return { reset: resetCount, errors: errorCount };
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      const result = await applyFeatureFlags();
      console.log("\n✅ Feature flags application completed successfully!");
      
      // Optionally show all flags after application
      await getAllFeatureFlags();
      
      process.exit(0);
    } catch (error) {
      console.error("❌ Failed to apply feature flags:", error);
      process.exit(1);
    }
  })();
}