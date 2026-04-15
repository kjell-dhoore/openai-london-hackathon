import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { TaskCompletionRequest } from "@/types/api";
import { useSession } from "@/context/SessionContext";

export function useTaskDetail(taskId: string | undefined) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["task", session?.sessionId, taskId],
    queryFn: () => api.getTaskDetail(session!.sessionId, taskId!),
    enabled: !!session?.sessionId && !!taskId,
  });
}

export function useCompleteTask(taskId: string | undefined) {
  const { session, refreshSession } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body?: TaskCompletionRequest) =>
      api.completeTask(session!.sessionId, taskId!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", session?.sessionId, taskId] });
      qc.invalidateQueries({ queryKey: ["dashboard", session?.sessionId] });
      qc.invalidateQueries({ queryKey: ["growthPlan", session?.sessionId] });
      refreshSession();
    },
  });
}
