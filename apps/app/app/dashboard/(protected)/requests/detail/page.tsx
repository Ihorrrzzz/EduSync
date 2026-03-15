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
  formatDecisionLabel,
} from "../../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../../components/screen-spinner";
import {
  fetchClubRequest,
  fetchParentRequest,
  submitClubEvidence,
  type ClubRequestRecord,
  type RecognitionRequestRecord,
} from "../../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../../lib/use-role-access";

type EvidenceFormState = {
  clubEvidenceSummary: string;
  attendanceRate: string;
  externalPerformanceBand: string;
};

function DashboardRequestDetailContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");
  const { me, isLoading, isAllowed } = useRoleAccess(["parent", "club"]);
  const [parentRequest, setParentRequest] = useState<RecognitionRequestRecord | null>(null);
  const [clubRequest, setClubRequest] = useState<ClubRequestRecord | null>(null);
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [evidenceForm, setEvidenceForm] = useState<EvidenceFormState>({
    clubEvidenceSummary: "",
    attendanceRate: "",
    externalPerformanceBand: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!requestId || !me || !isAllowed) {
      setIsFetching(false);
      return;
    }

    const loadData = async () => {
      setIsFetching(true);
      setPageError("");

      try {
        if (me.profile.role === "parent") {
          const response = await fetchParentRequest(requestId);
          setParentRequest(response.request);
        } else {
          const response = await fetchClubRequest(requestId);
          setClubRequest(response.request);
          setEvidenceForm({
            clubEvidenceSummary: response.request.clubEvidenceSummary ?? "",
            attendanceRate:
              response.request.attendanceRate !== null
                ? String(response.request.attendanceRate)
                : "",
            externalPerformanceBand: response.request.externalPerformanceBand ?? "",
          });
        }
      } catch (loadError) {
        setPageError(
          loadError instanceof Error
            ? loadError.message
            : "Не вдалося завантажити деталі запиту",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [isAllowed, me, requestId]);

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!requestId) {
    return (
      <EmptyState
        title="Не знайдено id запиту"
        description="Поверніться до списку запитів і відкрийте потрібну картку ще раз."
      />
    );
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Ця сторінка доступна для батьківського кабінету та кабінету гуртка."
      />
    );
  }

  const isParent = me.profile.role === "parent";
  const request = isParent ? parentRequest : clubRequest;
  const parentView = isParent ? (request as RecognitionRequestRecord | null) : null;
  const clubView = !isParent ? (request as ClubRequestRecord | null) : null;

  if (!request || pageError) {
    return (
      <EmptyState
        title="Не вдалося відкрити запит"
        description={pageError || "Запит не знайдено або вже недоступний для цієї ролі."}
      />
    );
  }

  const handleEvidenceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isParent) {
      return;
    }

    setSubmitError("");
    setSubmitStatus("");
    setIsSubmitting(true);

    try {
      const response = await submitClubEvidence(request.id, {
        clubEvidenceSummary: evidenceForm.clubEvidenceSummary,
        attendanceRate: evidenceForm.attendanceRate
          ? Number(evidenceForm.attendanceRate)
          : null,
        externalPerformanceBand: evidenceForm.externalPerformanceBand.trim() || null,
      });

      setClubRequest(response.request);
      setSubmitStatus("Докази від гуртка збережено.");
    } catch (submitRequestError) {
      setSubmitError(
        submitRequestError instanceof Error
          ? submitRequestError.message
          : "Не вдалося оновити підсумок доказів",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Деталі запиту"
        title={request.clubProgram.title}
        description={
          isParent
            ? "Тут видно поточний статус, AI-підсумок, пакет доказів від гуртка та фінальне рішення школи."
            : "Тут можна доповнити підсумок доказів для школи та перевірити, що бачить шкільний розгляд."
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={request.status} />
        {request.aiAnalysis ? <BandBadge band={request.aiAnalysis.recommendationBand} /> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Основна інформація
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Дитина</div>
                <div className="mt-1">
                  {request.child.fullName} · {request.child.grade} клас
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Школа</div>
                <div className="mt-1">{request.school.name}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Предмет і обсяг</div>
                <div className="mt-1">
                  {request.targetSubject} ·{" "}
                  {request.recognitionScope === "FULL"
                    ? "повне врахування для розгляду"
                    : "часткове врахування"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">
                  {isParent ? "Клуб" : "Батьки"}
                </div>
                <div className="mt-1">
                  {isParent && parentView
                    ? `${parentView.club.name}${parentView.club.city ? `, ${parentView.club.city}` : ""}`
                    : clubView
                      ? `${clubView.parent.displayName} · ${clubView.parent.email}`
                      : ""}
                </div>
              </div>
            </div>

            {request.parentNote ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                <div className="font-semibold text-slate-900">Нотатка батьків</div>
                <div className="mt-1">{request.parentNote}</div>
              </div>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Докази від гуртка
            </h2>

            {isParent ? (
              <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Підсумок доказів</div>
                  <div className="mt-1">
                    {request.clubEvidenceSummary ?? "Гурток ще не додав підсумковий опис."}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Відвідуваність і рівень</div>
                  <div className="mt-1">
                    {request.attendanceRate !== null
                      ? `${request.attendanceRate}% відвідуваності`
                      : "Відвідуваність ще не зафіксована"}
                    {request.externalPerformanceBand
                      ? ` · Рівень: ${request.externalPerformanceBand}`
                      : ""}
                  </div>
                </div>
              </div>
            ) : (
              <form className="mt-6 grid gap-4" onSubmit={handleEvidenceSubmit}>
                <div className="grid gap-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="clubEvidenceSummary"
                  >
                    Підсумок доказів
                  </label>
                  <textarea
                    id="clubEvidenceSummary"
                    className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={evidenceForm.clubEvidenceSummary}
                    onChange={(event) =>
                      setEvidenceForm((currentValue) => ({
                        ...currentValue,
                        clubEvidenceSummary: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="attendanceRate">
                      Відвідуваність, %
                    </label>
                    <input
                      id="attendanceRate"
                      type="number"
                      min={0}
                      max={100}
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={evidenceForm.attendanceRate}
                      onChange={(event) =>
                        setEvidenceForm((currentValue) => ({
                          ...currentValue,
                          attendanceRate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="externalPerformanceBand"
                    >
                      Зовнішній рівень
                    </label>
                    <input
                      id="externalPerformanceBand"
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={evidenceForm.externalPerformanceBand}
                      onChange={(event) =>
                        setEvidenceForm((currentValue) => ({
                          ...currentValue,
                          externalPerformanceBand: event.target.value,
                        }))
                      }
                    />
                  </div>
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
                  {isSubmitting ? "Збереження..." : "Зберегти докази"}
                </button>
              </form>
            )}
          </SurfaceCard>

          {request.decision ? (
            <SurfaceCard>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Фінальне рішення школи
              </h2>
              <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Рішення</div>
                  <div className="mt-1">{formatDecisionLabel(request.decision.decision)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Коментар</div>
                  <div className="mt-1">{request.decision.comment}</div>
                </div>
                {request.decision.recognizedTopics.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                    <div className="font-semibold text-slate-900">Визнані теми</div>
                    <div className="mt-1">{request.decision.recognizedTopics.join(", ")}</div>
                  </div>
                ) : null}
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <AdvisoryNote />

          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              AI-рекомендація
            </h2>
            {request.aiAnalysis ? (
              <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Підсумок</div>
                  <div className="mt-1">{request.aiAnalysis.summary}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Покриті результати</div>
                  <div className="mt-1">
                    {request.aiAnalysis.matchedOutcomes.length > 0
                      ? request.aiAnalysis.matchedOutcomes.join(" • ")
                      : "Немає деталізації"}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Прогалини</div>
                  <div className="mt-1">
                    {request.aiAnalysis.gaps.length > 0
                      ? request.aiAnalysis.gaps.join(" • ")
                      : "Критичних прогалин не знайдено"}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="font-semibold text-slate-900">Рекомендовані докази</div>
                  <div className="mt-1">
                    {request.aiAnalysis.suggestedEvidence.join(" • ")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                AI-підсумок для цього запиту поки що відсутній.
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

export default function DashboardRequestDetailPage() {
  return (
    <Suspense fallback={<ScreenSpinner />}>
      <DashboardRequestDetailContent />
    </Suspense>
  );
}
