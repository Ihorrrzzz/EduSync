"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, X, BookOpen, Users } from "lucide-react";
import {
  EmptyState,
  PageHeading,
  StatusBadge,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  fetchClubEnrollments,
  submitEnrollmentDecision,
  type EnrollmentRecord,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

export default function DashboardStudentsPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["club"]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [decidingIds, setDecidingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    const loadData = async () => {
      setIsFetching(true);
      setPageError("");

      try {
        const response = await fetchClubEnrollments();
        setEnrollments(response.enrollments);
      } catch (loadError) {
        setPageError(
          loadError instanceof Error
            ? loadError.message
            : "Не вдалося завантажити список учнів",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [isAllowed]);

  const handleDecision = async (
    id: string,
    decision: "APPROVE" | "REJECT",
  ) => {
    setDecidingIds((prev) => new Set(prev).add(id));

    try {
      const response = await submitEnrollmentDecision(id, { decision });
      setEnrollments((prev) =>
        prev.map((enrollment) =>
          enrollment.id === id ? response.enrollment : enrollment,
        ),
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Не вдалося обробити рішення",
      );
    } finally {
      setDecidingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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

  const pendingEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "PENDING",
  );
  const approvedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "APPROVED",
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Учні гуртка"
        title="Учні"
        description="Керуйте заявками на вступ до гуртка та переглядайте журнали відвідування учнів."
      />

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      {/* Pending enrollments section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users strokeWidth={2.1} className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Заявки на вступ
          </h2>
          {pendingEnrollments.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {pendingEnrollments.length}
            </span>
          )}
        </div>

        {pendingEnrollments.length === 0 ? (
          <EmptyState
            title="Немає нових заявок"
            description="Коли батьки подадуть заявки на вступ до вашого гуртка, вони з'являться тут."
          />
        ) : (
          <div className="grid gap-4">
            {pendingEnrollments.map((enrollment) => (
              <SurfaceCard key={enrollment.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {enrollment.clubProgram.subjectArea}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {enrollment.child.fullName}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {enrollment.child.grade} клас · Програма:{" "}
                      {enrollment.clubProgram.title} · Батько/мати:{" "}
                      {enrollment.parent.displayName}
                    </p>
                    {enrollment.note && (
                      <p className="mt-2 text-sm italic leading-6 text-slate-500">
                        &quot;{enrollment.note}&quot;
                      </p>
                    )}
                  </div>

                  <StatusBadge status={enrollment.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={decidingIds.has(enrollment.id)}
                    onClick={() => handleDecision(enrollment.id, "APPROVE")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(22,163,74,0.22)] transition hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Прийняти
                  </button>
                  <button
                    type="button"
                    disabled={decidingIds.has(enrollment.id)}
                    onClick={() => handleDecision(enrollment.id, "REJECT")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Відхилити
                  </button>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>

      {/* Approved students section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen strokeWidth={2.1} className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Учні
          </h2>
          {approvedEnrollments.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
              {approvedEnrollments.length}
            </span>
          )}
        </div>

        {approvedEnrollments.length === 0 ? (
          <EmptyState
            title="Поки немає учнів"
            description="Тут з'являться учні, яких ви прийняли до гуртка."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {approvedEnrollments.map((enrollment) => (
              <SurfaceCard key={enrollment.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                      {enrollment.child.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {enrollment.child.grade} клас
                    </p>
                  </div>
                  <StatusBadge status={enrollment.status} />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Програма
                    </span>
                    <span className="text-slate-900">
                      {enrollment.clubProgram.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Предмет
                    </span>
                    <span className="text-slate-900">
                      {enrollment.clubProgram.subjectArea}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Дата вступу
                    </span>
                    <span className="text-slate-900">
                      {new Date(enrollment.createdAt).toLocaleDateString(
                        "uk-UA",
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href={`/dashboard/students/journal?enrollmentId=${enrollment.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
                  >
                    <BookOpen className="h-4 w-4" />
                    Журнал
                  </Link>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
