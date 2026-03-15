"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  MetricCard,
  PageHeading,
  StatusBadge,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { fetchClubRequests, type ClubRequestRecord } from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

type ClubStudentSummary = {
  childId: string;
  fullName: string;
  grade: number;
  schoolName: string | null;
  latestStatus: ClubRequestRecord["status"];
  latestRequestId: string;
  latestUpdatedAt: string;
  requestsCount: number;
  activeRequestsCount: number;
  programs: string[];
};

function isActiveStatus(status: ClubRequestRecord["status"]) {
  return (
    status === "SUBMITTED" ||
    status === "AI_READY" ||
    status === "UNDER_REVIEW" ||
    status === "CHANGES_REQUESTED"
  );
}

export default function DashboardStudentsPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["club"]);
  const [requests, setRequests] = useState<ClubRequestRecord[]>([]);
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
        const response = await fetchClubRequests();
        setRequests(response.requests);
      } catch (loadError) {
        setPageError(
          loadError instanceof Error ? loadError.message : "Не вдалося завантажити список учнів",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [isAllowed]);

  const students = useMemo<ClubStudentSummary[]>(() => {
    const grouped = new Map<string, ClubStudentSummary>();

    requests.forEach((request) => {
      const existing = grouped.get(request.child.id);

      if (!existing) {
        grouped.set(request.child.id, {
          childId: request.child.id,
          fullName: request.child.fullName,
          grade: request.child.grade,
          schoolName:
            request.child.school?.name ?? request.child.schoolNameSnapshot ?? request.school.name,
          latestStatus: request.status,
          latestRequestId: request.id,
          latestUpdatedAt: request.updatedAt,
          requestsCount: 1,
          activeRequestsCount: isActiveStatus(request.status) ? 1 : 0,
          programs: [request.clubProgram.title],
        });

        return;
      }

      existing.requestsCount += 1;
      existing.activeRequestsCount += isActiveStatus(request.status) ? 1 : 0;

      if (!existing.programs.includes(request.clubProgram.title)) {
        existing.programs.push(request.clubProgram.title);
      }

      if (new Date(request.updatedAt).getTime() > new Date(existing.latestUpdatedAt).getTime()) {
        existing.latestStatus = request.status;
        existing.latestRequestId = request.id;
        existing.latestUpdatedAt = request.updatedAt;
      }
    });

    return Array.from(grouped.values()).sort(
      (left, right) =>
        new Date(right.latestUpdatedAt).getTime() - new Date(left.latestUpdatedAt).getTime(),
    );
  }, [requests]);

  const programsCount = useMemo(() => {
    return new Set(
      students.flatMap((student) => student.programs),
    ).size;
  }, [students]);

  const activeCasesCount = requests.filter((request) => isActiveStatus(request.status)).length;

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Сторінка учнів доступна тільки для кабінету гуртка."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Учні"
        title="Список учнів гуртка"
        description="Тут зібрані діти, які вже з'явилися у ваших програмах і запитах. Це окремий робочий розділ для перегляду учнів та переходу до пов'язаних заявок."
        actions={
          <>
            <Link
              href="/dashboard/requests"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              До запитів
            </Link>
            <Link
              href="/dashboard/programs"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              До програм
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Учні у списку"
          value={students.length}
          hint="Унікальні діти, які вже проходять через ваші програми або запити."
        />
        <MetricCard
          label="Активні кейси"
          value={activeCasesCount}
          hint="Заявки, які ще перебувають у роботі або очікують відповіді."
        />
        <MetricCard
          label="Програми з учнями"
          value={programsCount}
          hint="Кількість програм, у яких уже зафіксована активність учнів."
        />
      </div>

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      {students.length === 0 ? (
        <EmptyState
          title="Поки немає учнів у списку"
          description="Коли до ваших програм з'являться заявки, тут відобразяться пов'язані діти та їхній поточний стан."
        />
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <SurfaceCard key={student.childId}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {student.schoolName ?? "Школу ще не вказано"}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {student.fullName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {student.grade} клас · {student.requestsCount} заяв{student.requestsCount === 1 ? "ка" : student.requestsCount < 5 ? "ки" : "ок"} пов'язано з учнем.
                  </p>
                </div>

                <StatusBadge status={student.latestStatus} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">Програми</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {student.programs.map((program) => (
                      <span
                        key={program}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {program}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">У роботі</div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {student.activeRequestsCount}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    Активних заявок по цьому учню.
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/requests/detail?id=${student.latestRequestId}`}
                  className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
                >
                  Відкрити останній запит
                </Link>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
