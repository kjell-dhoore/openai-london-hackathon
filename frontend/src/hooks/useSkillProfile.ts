import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useSession } from "@/context/SessionContext";

export function useSkillProfile() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["skillProfile", session?.sessionId],
    queryFn: () => api.getSkillProfile(session!.sessionId),
    enabled: !!session?.sessionId,
  });
}
