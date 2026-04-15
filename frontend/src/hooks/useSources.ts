import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { SourceSelectionRequest } from "@/types/api";
import { useSession } from "@/context/SessionContext";

export function useSourceCatalog() {
  return useQuery({
    queryKey: ["sourceCatalog"],
    queryFn: api.getSourceCatalog,
  });
}

export function useSelectedSources() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["selectedSources", session?.sessionId],
    queryFn: () => api.getSelectedSources(session!.sessionId),
    enabled: !!session?.sessionId,
  });
}

export function useUpdateSources() {
  const { session } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: SourceSelectionRequest) =>
      api.updateSelectedSources(session!.sessionId, body),
    onSuccess: (data) => {
      qc.setQueryData(["selectedSources", session?.sessionId], data);
    },
  });
}
