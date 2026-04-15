import { useQuery, useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { GrowthPlanGenerateRequest } from "@/types/api";
import { useSession } from "@/context/SessionContext";

export function useGrowthPlan(enabled = true) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["growthPlan", session?.sessionId],
    queryFn: () => api.getGrowthPlan(session!.sessionId),
    enabled: !!session?.sessionId && enabled,
  });
}

export function useGenerateGrowthPlan() {
  const { session } = useSession();

  return useMutation({
    mutationFn: (body?: GrowthPlanGenerateRequest) =>
      api.generateGrowthPlan(session!.sessionId, body),
  });
}
