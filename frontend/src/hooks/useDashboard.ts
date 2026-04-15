import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useSession } from "@/context/SessionContext";

export function useDashboard() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["dashboard", session?.sessionId],
    queryFn: () => api.getDashboard(session!.sessionId),
    enabled: !!session?.sessionId,
  });
}
