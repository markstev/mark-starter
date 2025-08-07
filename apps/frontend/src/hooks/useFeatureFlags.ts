import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

export function useFeatureFlags() {
  const trpc = useTRPC();

  const { data: flags = {}, isLoading, error } = useQuery({
    ...trpc.featureFlags.getUserFlags.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const isFlagEnabled = (flagName: string): boolean => {
    return flags[flagName] ?? false;
  };

  return {
    flags,
    isFlagEnabled,
    isLoading,
    error,
  };
}

// Hook for checking a single flag
export function useFeatureFlag(flagName: string) {
  const { isFlagEnabled, isLoading } = useFeatureFlags();
  
  return {
    isEnabled: isFlagEnabled(flagName),
    isLoading,
  };
} 