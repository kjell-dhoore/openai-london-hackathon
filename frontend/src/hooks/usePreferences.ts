import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { PreferencesUpdateRequest } from "@/types/api";
import { useSession } from "@/context/SessionContext";

export function usePreferences() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["preferences", session?.sessionId],
    queryFn: () => api.getPreferences(session!.sessionId),
    enabled: !!session?.sessionId,
  });
}

export function useUpdatePreferences() {
  const { session } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: PreferencesUpdateRequest) =>
      api.updatePreferences(session!.sessionId, body),
    onSuccess: (data) => {
      qc.setQueryData(["preferences", session?.sessionId], data);
    },
  });
}
