"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  AdvisoryNote,
  BandBadge,
  EmptyState,
  PageHeading,
  StatusBadge,
  SurfaceCard,
} from "../../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../../components/screen-spinner";
import {
  fetchSchoolRequest,
  submitSchoolDecision,
  type DecisionRecord,
  type RecognitionRequestRecord,
} from "../../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../../lib/use-role-access";

const decisionOptions: Array<{
  value: DecisionRecord["decision"];
  label: string;
}> = [
  { value: "APPROVE", label: "Погодити" },
  { value: "PARTIAL", label: "Частково погодити" },
  { value: "REQUEST_CHANGES", label: "Попросити зміни" },
  { value: "REJECT", label: "Відхилити" },
];

function DashboardReviewDetailContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");
  const { me, isLoading, isAllowed } = useRoleAccess(["school"]);
  const [request, setRequest] = useState<RecognitionRequestRecord | null>(null);
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [decision, setDecision] = useState<DecisionRecord["decision"]>("PARTIAL");
  const [comment, setComment] = useState("");
  const [recognizedTopics, setRecognizedTopics] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!requestId || !isAllowed) {
      setIsFetching(false);
      return;
    }

    const loadData = async () => {
      setIsFetching(true);
      setPageError("");

      try {
        const response = await fetchSchoolRequest(requestId, {
          markUnderReview: true,
        });
        setRequest(response.request);
        setComment(response.request.decision?.comment ?? "");
        setDecision(response.request.decision?.decision ?? "PARTIAL");
        setRecognizedTopics(
          response.request.decision?.recognizedTopics.join(", ") ?? "",
        );
      } catch (loadError) {
        setPageError(
          loadError instanceof Error
            ? loadError.message
            : "Не вдалося завантажити розгляд",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [isAllowed, requestId]);

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!requestId || !me || !isAllowed) {
    return (
      <EmptyState
        title="Розгляд недоступний"
        description="Сторінка деталей доступна тільки для школи і потребує id запиту."
      />
    );
  }

  if (!request || pageError) {
    return (
      <EmptyState
        title="Не вдалося відкрити запит"
        description={pageError || "Запит не знайдено."}
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitStatus("");
    setIsSubmitting(true);

    try {
      const response = await submitSchoolDecision(request.id, {
        decision,
        comment,
        recognizedTopics: recognizedTopics
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setRequest(response.request);
      setSubmitStatus("Рішення школи збережено.");
    } catch (submitDecisionError) {
      setSubmitError(
        submitDecisionError instanceof Error
          ? submitDecisionError.message
          : "Не вдалося зберегти рішення",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Шкільний розгляд"
        title={`${request.child.fullName} · ${request.targetSubject}`}
        description="AI-панель і пакет доказів наведені нижче. Фінальне рішення має заповнити школа."
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={request.status} />
        {request.aiAnalysis ? <BandBadge band={request.aiAnalysis.recommendationBand} /> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Запит та пакет доказів
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Дитина</div>
                <div className="mt-1">
                  {request.child.fullName} · {request.child.grade} клас
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Клуб і програма</div>
                <div className="mt-1">
                  {request.club.name} · {request.clubProgram.title}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Предмет для розгляду</div>
                <div className="mt-1">
                  {request.targetSubject} · {request.targetGrade} клас ·{" "}
                  {request.recognitionScope === "FULL"
                    ? "повне врахування для розгляду"
                    : "часткове врахування"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Нотатка батьків</div>
                <div className="mt-1">{request.parentNote ?? "Нотатки немає"}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                <div className="font-semibold text-slate-900">Підсумок доказів від гуртка</div>
                <div className="mt-1">
                  {request.clubEvidenceSummary ?? "Гурток ще не надіслав підсумок доказів."}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                <div className="font-semibold text-slate-900">Відвідуваність і рівень</div>
                <div className="mt-1">
                  {request.attendanceRate !== null
                    ? `${request.attendanceRate}% відвідуваності`
                    : "Відвідуваність ще не вказано"}
                  {request.externalPerformanceBand
                    ? ` · Рівень: ${request.externalPerformanceBand}`
                    : ""}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                <div className="font-semibold text-slate-900">Опис програми</div>
                <div className="mt-1">{request.clubProgram.fullDescription}</div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Рішення школи
            </h2>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="decision">
                  Рішення
                </label>
                <select
                  id="decision"
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={decision}
                  onChange={(event) => setDecision(event.target.value as DecisionRecord["decision"])}
                >
                  {decisionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="comment">
                  Коментар школи
                </label>
                <textarea
                  id="comment"
                  className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="recognizedTopics">
                  Визнані теми
                </label>
                <input
                  id="recognizedTopics"
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={recognizedTopics}
                  onChange={(event) => setRecognizedTopics(event.target.value)}
                  placeholder="Через кому, якщо потрібно"
                />
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              ) : null}

              {submitStatus ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {submitStatus}
                </div>
              ) : null}

              <button
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Збереження..." : "Зберегти рішення"}
              </button>
            </form>
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <AdvisoryNote />

          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              AI-панель
            </h2>
            {request.aiAnalysis ? (
              <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Підсумок</div>
                  <div className="mt-1">{request.aiAnalysis.summary}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Покриті результати</div>
                  <div className="mt-1">{request.aiAnalysis.matchedOutcomes.join(" • ")}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Прогалини</div>
                  <div className="mt-1">{request.aiAnalysis.gaps.join(" • ")}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Рекомендовані докази</div>
                  <div className="mt-1">{request.aiAnalysis.suggestedEvidence.join(" • ")}</div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-amber-900">
                  {request.aiAnalysis.safeBandExplanation}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                AI-аналіз ще не згенеровано.
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

export default function DashboardReviewDetailPage() {
  return (
    <Suspense fallback={<ScreenSpinner />}>
      <DashboardReviewDetailContent />
    </Suspense>
  );
}
