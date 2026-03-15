"use client";

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
  fetchSchoolRequests,
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

export default function DashboardReviewPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["school"]);
  const [requests, setRequests] = useState<RecognitionRequestRecord[]>([]);
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
        eyebrow="Шкільний розгляд"
        title="Черга запитів на розгляд"
        description="Школа бачить структуровані докази, AI-рекомендацію і зберігає фінальне рішення по кожному запиту."
      />

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

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      {requests.length === 0 ? (
        <EmptyState
          title="Черга порожня"
          description="Запити з обраним фільтром не знайдено."
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
