import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { QuizSubmissionRequest, ProfileIntakePayload } from "@/types/api";
import { useSession } from "@/context/SessionContext";

export function useSubmitProfileIntake() {
  const { session } = useSession();

  return useMutation({
    mutationFn: (payload: { file?: File; fields: ProfileIntakePayload }) => {
      const sessionId = session!.sessionId;

      if (payload.file) {
        const fd = new FormData();
        fd.append("resumeFile", payload.file);
        fd.append("importMode", "resume_upload");
        for (const [k, v] of Object.entries(payload.fields)) {
          if (v != null) fd.append(k, String(v));
        }
        return api.submitProfileIntakeForm(sessionId, fd);
      }

      return api.submitProfileIntakeJson(sessionId, {
        ...payload.fields,
        importMode: payload.fields.importMode ?? "summary_only",
      });
    },
  });
}

export function useSubmitQuizResponses() {
  const { session } = useSession();

  return useMutation({
    mutationFn: (body: QuizSubmissionRequest) =>
      api.submitQuizResponses(session!.sessionId, body),
  });
}

export function useProfileSummary(enabled = true) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["profile", session?.sessionId],
    queryFn: () => api.getProfileSummary(session!.sessionId),
    enabled: !!session?.sessionId && enabled,
  });
}
