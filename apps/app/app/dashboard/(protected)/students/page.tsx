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
        description="Тут ви бачите дітей, які навчаються за вашими програмами, та можете перейти до пов'язаних заявок."
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
          hint="Тут показано кількість дітей, які навчаються за вашими програмами."
        />
        <MetricCard
          label="Активні кейси"
          value={activeCasesCount}
          hint="Тут ви бачите заявки, які ще перебувають у роботі або очікують відповіді."
        />
        <MetricCard
          label="Програми з учнями"
          value={programsCount}
          hint="Тут показано, скільки ваших програм вже мають активних учнів."
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
          description="Коли до ваших програм надійдуть заявки, тут ви побачите пов'язаних дітей та їхній поточний стан."
        />
      ) : (
        <SurfaceCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Учень</th>
                  <th className="px-4 py-3">Клас</th>
                  <th className="px-4 py-3">Школа</th>
                  <th className="px-4 py-3">Програми</th>
                  <th className="px-4 py-3">Активних заявок</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Оновлено</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.childId}
                    className="border-t border-slate-100 transition hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {student.grade}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {student.schoolName ?? "Не вказано"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.programs.map((program) => (
                          <span
                            key={program}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {program}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {student.activeRequestsCount}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={student.latestStatus} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {new Date(student.latestUpdatedAt).toLocaleDateString("uk-UA")}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/requests/detail?id=${student.latestRequestId}`}
                        className="whitespace-nowrap text-sm font-medium text-blue-600 transition hover:text-blue-800"
                      >
                        Відкрити запит
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
