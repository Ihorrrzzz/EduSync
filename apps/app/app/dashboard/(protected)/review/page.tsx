"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BandBadge,
  EmptyState,
  PageHeading,
  StatusBadge,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  fetchSchoolProgramReviews,
  fetchSchoolRequests,
  submitProgramReviewDecision,
  type ProgramComparisonReport,
  type ProgramReviewRecord,
  type RecognitionRequestRecord,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

const statusOptions: Array<{
  value: RecognitionRequestRecord["status"] | "";
  label: string;
}> = [
  { value: "", label: "Усі статуси" },
  { value: "SUBMITTED", label: "Подано" },
  { value: "AI_READY", label: "AI готовий" },
  { value: "UNDER_REVIEW", label: "На розгляді" },
  { value: "APPROVED", label: "Погоджено" },
  { value: "PARTIALLY_APPROVED", label: "Частково погоджено" },
  { value: "CHANGES_REQUESTED", label: "Потрібні зміни" },
  { value: "REJECTED", label: "Відхилено" },
];

function VerdictBadge({ verdict }: { verdict: ProgramComparisonReport["verdict"] }) {
  const config = {
    FULLY_SUITABLE: {
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Повністю відповідає",
    },
    PARTIALLY_SUITABLE: {
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      label: "Частково відповідає",
    },
    REJECT: {
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      label: "Не відповідає",
    },
  } as const;

  const { tone, label } = config[verdict];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function AlignmentStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Full"
      ? "text-emerald-700"
      : status === "Partial"
        ? "text-amber-700"
        : status === "Missing"
          ? "text-rose-700"
          : "text-red-700";

  return <span className={`text-xs font-semibold ${tone}`}>{status}</span>;
}

function AiReportSection({ report }: { report: ProgramComparisonReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={report.verdict} />
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">Покриття:</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${Math.min(report.coveragePercent, 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {report.coveragePercent}%
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {expanded ? "Згорнути деталі" : "Показати деталі"}
        {expanded ? (
          <ChevronUp className="h-4 w-4" strokeWidth={2.1} />
        ) : (
          <ChevronDown className="h-4 w-4" strokeWidth={2.1} />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-5">
          {/* Justification */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Обґрунтування</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">{report.justification}</p>
          </div>

          {/* Alignment table */}
          {report.alignmentDetails.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Деталі відповідності</h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                      <th className="border-b border-slate-100 px-3 py-2">Вимога</th>
                      <th className="border-b border-slate-100 px-3 py-2">Відповідність</th>
                      <th className="border-b border-slate-100 px-3 py-2">Статус</th>
                      <th className="border-b border-slate-100 px-3 py-2">Коментар</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.alignmentDetails.map((detail, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{detail.requirement}</td>
                        <td className="px-3 py-2 text-slate-600">{detail.match}</td>
                        <td className="px-3 py-2">
                          <AlignmentStatusBadge status={detail.status} />
                        </td>
                        <td className="px-3 py-2 text-slate-500">{detail.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Violations */}
          {report.violations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Порушення</h4>
              <ul className="mt-1 list-inside list-disc text-sm leading-6 text-slate-600">
                {report.violations.map((v, idx) => (
                  <li key={idx}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Рекомендації</h4>
              <ul className="mt-1 list-inside list-disc text-sm leading-6 text-slate-600">
                {report.recommendations.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardReviewPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["school"]);
  const [requests, setRequests] = useState<RecognitionRequestRecord[]>([]);
  const [programReviews, setProgramReviews] = useState<ProgramReviewRecord[]>([]);
  const [programReviewsLoading, setProgramReviewsLoading] = useState(true);
  const [returnComments, setReturnComments] = useState<Record<string, string>>({});
  const [returningId, setReturningId] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RecognitionRequestRecord["status"] | "">("");
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadData = async () => {
      setIsFetching(true);
      setPageError("");

      try {
        const response = await fetchSchoolRequests({
          status: statusFilter || undefined,
        });
        setRequests(response.requests);
      } catch (loadError) {
        setPageError(
          loadError instanceof Error
            ? loadError.message
            : "Не вдалося завантажити чергу розгляду",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [isAllowed, statusFilter]);

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadProgramReviews = async () => {
      setProgramReviewsLoading(true);

      try {
        const response = await fetchSchoolProgramReviews();
        setProgramReviews(response.reviews);
      } catch {
        // Program reviews error is non-critical; keep existing pageError if any
      } finally {
        setProgramReviewsLoading(false);
      }
    };

    void loadProgramReviews();
  }, [isAllowed]);

  const handleDecision = async (
    reviewId: string,
    decision: "APPROVE" | "RETURN" | "REJECT",
  ) => {
    setDecisionLoading(reviewId);

    try {
      await submitProgramReviewDecision(reviewId, {
        decision,
        comment: decision === "RETURN" ? returnComments[reviewId] : undefined,
      });

      setProgramReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          const statusMap = { APPROVE: "APPROVED", RETURN: "RETURNED", REJECT: "REJECTED" } as const;
          return { ...r, status: statusMap[decision] };
        }),
      );
      setReturningId(null);
      setReturnComments((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    } catch {
      // Decision failed silently for now
    } finally {
      setDecisionLoading(null);
    }
  };

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Шкільна черга розгляду доступна тільки для ролі школи."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Розгляд"
        title="Черга заявок на розгляд"
        description="Тут ви переглядаєте вхідні запити, бачите AI-рекомендацію та приймаєте рішення: підтвердити, скасувати або повернути на доопрацювання."
      />

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      {!programReviewsLoading && programReviews.length > 0 && (
        <SurfaceCard>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Програми від гуртків
          </h2>
          <div className="mt-5 grid gap-4">
            {programReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {review.clubProgram.title}
                    </div>
                    <div className="mt-1">{review.club.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {review.clubProgram.subjectArea}{review.clubProgram.audience ? ` · ${review.clubProgram.audience}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={review.status} />
                </div>

                {review.clubProgram.programFileUrl && (
                  <div className="mt-3">
                    <a
                      href={review.clubProgram.programFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 underline hover:text-blue-700"
                    >
                      Переглянути PDF програми
                    </a>
                  </div>
                )}

                {review.aiVerdict && review.aiReportJson && (
                  <AiReportSection report={review.aiReportJson} />
                )}

                {review.status === "PENDING" && (
                  <div className="mt-4 space-y-3">
                    {returningId === review.id && (
                      <textarea
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        rows={3}
                        placeholder="Коментар для повернення..."
                        value={returnComments[review.id] ?? ""}
                        onChange={(e) =>
                          setReturnComments((prev) => ({
                            ...prev,
                            [review.id]: e.target.value,
                          }))
                        }
                      />
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={decisionLoading === review.id}
                        onClick={() => handleDecision(review.id, "APPROVE")}
                        className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        Погодити
                      </button>
                      <button
                        type="button"
                        disabled={decisionLoading === review.id}
                        onClick={() => {
                          if (returningId === review.id) {
                            void handleDecision(review.id, "RETURN");
                          } else {
                            setReturningId(review.id);
                          }
                        }}
                        className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Повернути
                      </button>
                      <button
                        type="button"
                        disabled={decisionLoading === review.id}
                        onClick={() => handleDecision(review.id, "REJECT")}
                        className="inline-flex items-center rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Відхилити
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      <SurfaceCard>
        <div className="grid gap-2 sm:max-w-sm">
          <label className="text-sm font-medium text-slate-700" htmlFor="statusFilter">
            Фільтр за статусом
          </label>
          <select
            id="statusFilter"
            className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as RecognitionRequestRecord["status"] | "")
            }
          >
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </SurfaceCard>

      {requests.length === 0 ? (
        <EmptyState
          title="Черга порожня"
          description="За обраним фільтром запитів не знайдено. Спробуйте інший фільтр."
        />
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <SurfaceCard key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {request.targetSubject} · {request.targetGrade} клас
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {request.child.fullName}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {request.clubProgram.title} · {request.club.name}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={request.status} />
                  {request.aiAnalysis ? (
                    <BandBadge band={request.aiAnalysis.recommendationBand} />
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                  <div className="font-semibold text-slate-900">Дитина і школа</div>
                  <div className="mt-1">
                    {request.child.fullName} · {request.school.name}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                  <div className="font-semibold text-slate-900">AI-підсумок</div>
                  <div className="mt-1">
                    {request.aiAnalysis?.summary ?? "AI-підсумок ще відсутній"}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href={`/dashboard/review/detail?id=${request.id}`}
                  className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
                >
                  Відкрити розгляд
                </Link>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
