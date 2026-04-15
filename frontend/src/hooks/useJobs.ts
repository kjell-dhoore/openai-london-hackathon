import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { JobStatus } from "@/types/api";

/**
 * Polls a job endpoint every `intervalMs` until the job reaches
 * a terminal state (completed | failed).
 */
export function useJobPoller(
  jobId: string | null,
  options?: { intervalMs?: number; onCompleted?: (job: JobStatus) => void },
) {
  const intervalMs = options?.intervalMs ?? 1500;

  const query = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return intervalMs;
    },
  });

  const job = query.data ?? null;
  const isTerminal =
    job?.status === "completed" || job?.status === "failed";

  return {
    job,
    isTerminal,
    isCompleted: job?.status === "completed",
    isFailed: job?.status === "failed",
    isPolling: !!jobId && !isTerminal,
    ...query,
  };
}
