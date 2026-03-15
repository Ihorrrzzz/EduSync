"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Search, Users, X } from "lucide-react";
import {
  createEnrollment,
  fetchCatalogClubs,
  fetchChildren,
  fetchParentEnrollments,
  type CatalogClub,
  type ChildRecord,
  type EnrollmentRecord,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";
import {
  PageHeading,
  SurfaceCard,
  EmptyState,
  StatusBadge,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { subjectOptions } from "../../../../lib/subject-options";

export default function ClubsPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["parent"]);

  const [clubs, setClubs] = useState<CatalogClub[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [pageError, setPageError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const [enrollProgram, setEnrollProgram] = useState<{
    id: string;
    title: string;
    subjectArea: string;
    clubName: string;
    clubCity: string | null;
  } | null>(null);
  const [enrollChildId, setEnrollChildId] = useState("");
  const [enrollNote, setEnrollNote] = useState("");
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  const loadData = async () => {
    setIsFetching(true);
    setPageError("");
    try {
      const [clubsRes, childrenRes, enrollmentsRes] = await Promise.all([
        fetchCatalogClubs(),
        fetchChildren(),
        fetchParentEnrollments(),
      ]);
      setClubs(clubsRes.clubs);
      setChildren(childrenRes.children);
      setEnrollments(enrollmentsRes.enrollments);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Не вдалося завантажити дані",
      );
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) return;
    void loadData();
  }, [isAllowed]);

  if (isLoading || isFetching) return <ScreenSpinner />;
  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Ця сторінка доступна тільки для батьківського кабінету."
      />
    );
  }

  const enrolledProgramIds = new Set(
    enrollments.map((e) => e.clubProgram.id),
  );

  const filteredClubs = clubs.filter((club) => {
    if (subjectFilter && !club.subjects.includes(subjectFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        club.name.toLowerCase().includes(q) ||
        club.subjects.some((s) => s.toLowerCase().includes(q)) ||
        club.programs.some((p) => p.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleEnroll = async () => {
    if (!enrollProgram || !enrollChildId) return;
    setEnrollError("");
    setEnrollSubmitting(true);
    try {
      await createEnrollment({
        childId: enrollChildId,
        clubProgramId: enrollProgram.id,
        note: enrollNote.trim() || null,
      });
      setEnrollProgram(null);
      setEnrollChildId("");
      setEnrollNote("");
      await loadData();
    } catch (err) {
      setEnrollError(
        err instanceof Error ? err.message : "Не вдалося записатися",
      );
    } finally {
      setEnrollSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Батьківський кабінет"
        title="Гуртки та програми"
        description="Тут ви бачите всі доступні гуртки, їхні напрями та можете записати дитину на програму."
      />

      {/* Enroll Dialog */}
      {enrollProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">
                Записатися
              </h2>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                onClick={() => {
                  setEnrollProgram(null);
                  setEnrollError("");
                }}
              >
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                {enrollProgram.subjectArea}
              </div>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                {enrollProgram.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {enrollProgram.clubName}
                {enrollProgram.clubCity
                  ? ` · ${enrollProgram.clubCity}`
                  : ""}
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="enrollChild"
                >
                  Оберіть дитину
                </label>
                <select
                  id="enrollChild"
                  className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={enrollChildId}
                  onChange={(e) => setEnrollChildId(e.target.value)}
                  required
                >
                  <option value="">Оберіть дитину</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} · {c.grade} клас
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="enrollNote"
                >
                  Нотатка (необов&#39;язково)
                </label>
                <textarea
                  id="enrollNote"
                  className="min-h-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={enrollNote}
                  onChange={(e) => setEnrollNote(e.target.value)}
                  placeholder="Коротко про очікування"
                />
              </div>

              {enrollError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {enrollError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-slate-200 h-14 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setEnrollProgram(null);
                    setEnrollError("");
                  }}
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  className="flex-1 bg-blue-600 text-white rounded-2xl h-14 text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={enrollSubmitting || !enrollChildId}
                  onClick={handleEnroll}
                >
                  {enrollSubmitting ? "Відправка..." : "Записатися"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pageError && (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      )}

      {/* Existing enrollments */}
      {enrollments.length > 0 && (
        <SurfaceCard>
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            Ваші записи
          </h2>
          <div className="mt-4 space-y-3">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                    <Users
                      className="h-4 w-4 text-slate-400"
                      strokeWidth={2.1}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {enr.child.fullName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {enr.clubProgram.title} — {enr.club.name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={enr.status} />
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2.1}
          />
          <input
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Пошук за назвою гуртка або програми..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="">Усі напрями</option>
          {subjectOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Clubs catalog */}
      {filteredClubs.length === 0 ? (
        <EmptyState
          title="Гуртків не знайдено"
          description="Спробуйте змінити фільтри або зверніться пізніше."
        />
      ) : (
        <div className="space-y-6">
          {filteredClubs.map((club) => (
            <SurfaceCard key={club.id}>
              {/* Club header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                    <Building2
                      className="h-5 w-5 text-blue-600"
                      strokeWidth={2.1}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {club.name}
                    </h3>
                    {club.city && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin
                          className="h-3.5 w-3.5"
                          strokeWidth={2.1}
                        />
                        {club.city}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject pills */}
                <div className="flex flex-wrap gap-1.5">
                  {club.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Programs */}
              {club.programs.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  Гурток ще не опублікував програм.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {club.programs.map((program) => {
                    const isEnrolled = enrolledProgramIds.has(program.id);

                    return (
                      <div
                        key={program.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                                {program.subjectArea}
                              </span>
                              {program.programFileUrl && (
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400">
                                  PDF
                                </span>
                              )}
                            </div>
                            <h4 className="mt-1 text-base font-semibold text-slate-900">
                              {program.title}
                            </h4>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {program.shortDescription}
                            </p>
                            {(program.ageMin || program.ageMax) && (
                              <div className="mt-2 flex gap-2">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                                  Вік: {program.ageMin ?? "?"}-
                                  {program.ageMax ?? "?"}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isEnrolled ? (
                              <span className="inline-flex h-9 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700">
                                Заявку надіслано
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="inline-flex h-9 items-center gap-1.5 rounded-2xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(37,99,255,0.18)] transition hover:bg-blue-700"
                                onClick={() => {
                                  setEnrollProgram({
                                    id: program.id,
                                    title: program.title,
                                    subjectArea: program.subjectArea,
                                    clubName: club.name,
                                    clubCity: club.city,
                                  });
                                  setEnrollChildId("");
                                  setEnrollNote("");
                                  setEnrollError("");
                                }}
                              >
                                Записатися
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
