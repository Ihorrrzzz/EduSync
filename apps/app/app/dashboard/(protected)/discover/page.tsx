"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdvisoryNote,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import { subjectOptions } from "../../../../lib/subject-options";
import {
  createRecognitionRequest,
  fetchCatalogPrograms,
  fetchChildren,
  fetchSchools,
  type ChildRecord,
  type ProgramRecord,
  type SchoolCatalogItem,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

type RequestFormState = {
  childId: string;
  schoolId: string;
  targetSubject: string;
  targetGrade: string;
  recognitionScope: "FULL" | "PARTIAL";
  parentNote: string;
};

const initialRequestForm: RequestFormState = {
  childId: "",
  schoolId: "",
  targetSubject: "",
  targetGrade: "",
  recognitionScope: "PARTIAL",
  parentNote: "",
};

function describeProgramFit(program: ProgramRecord) {
  const agePart =
    program.ageMin || program.ageMax
      ? `Вік ${program.ageMin ?? "?"}-${program.ageMax ?? "?"}`
      : "Вік не обмежено";
  const gradePart =
    program.gradeMin || program.gradeMax
      ? `Клас ${program.gradeMin ?? "?"}-${program.gradeMax ?? "?"}`
      : "Клас не обмежено";

  return `${agePart} · ${gradePart}`;
}

export default function DashboardDiscoverPage() {
  const router = useRouter();
  const { me, isLoading, isAllowed } = useRoleAccess(["parent"]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [schools, setSchools] = useState<SchoolCatalogItem[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramRecord | null>(null);
  const [requestForm, setRequestForm] = useState<RequestFormState>(initialRequestForm);
  const [filters, setFilters] = useState({
    subject: "",
    city: "",
    age: "",
    grade: "",
    search: "",
  });
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const loadData = async () => {
    setIsFetching(true);
    setPageError("");

    try {
      const [programsResponse, childrenResponse, schoolsResponse] = await Promise.all([
        fetchCatalogPrograms({
          subject: filters.subject || undefined,
          city: filters.city || undefined,
          age: filters.age ? Number(filters.age) : undefined,
          grade: filters.grade ? Number(filters.grade) : undefined,
          search: filters.search || undefined,
        }),
        fetchChildren(),
        fetchSchools(),
      ]);

      setPrograms(programsResponse.programs);
      setChildren(childrenResponse.children);
      setSchools(schoolsResponse.schools);
    } catch (loadError) {
      setPageError(
        loadError instanceof Error
          ? loadError.message
          : "Не вдалося завантажити каталог",
      );
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    void loadData();
  }, [isAllowed, filters.subject, filters.city, filters.age, filters.grade, filters.search]);

  useEffect(() => {
    if (!selectedProgram) {
      return;
    }

    setRequestForm((currentValue) => ({
      ...currentValue,
      targetSubject: selectedProgram.subjectArea,
    }));
  }, [selectedProgram]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === requestForm.childId) ?? null,
    [children, requestForm.childId],
  );

  useEffect(() => {
    if (!selectedChild) {
      return;
    }

    setRequestForm((currentValue) => ({
      ...currentValue,
      targetGrade: currentValue.targetGrade || String(selectedChild.grade),
      schoolId: currentValue.schoolId || selectedChild.schoolId || "",
    }));
  }, [selectedChild]);

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Каталог недоступний"
        description="Ця сторінка працює тільки для батьківського кабінету."
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProgram) {
      setSubmitError("Спочатку оберіть програму.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await createRecognitionRequest({
        childId: requestForm.childId,
        schoolId: requestForm.schoolId,
        clubProgramId: selectedProgram.id,
        targetSubject: requestForm.targetSubject,
        targetGrade: Number(requestForm.targetGrade),
        recognitionScope: requestForm.recognitionScope,
        parentNote: requestForm.parentNote.trim() || null,
      });

      router.push(`/dashboard/requests/detail?id=${response.request.id}`);
    } catch (submitRequestError) {
      setSubmitError(
        submitRequestError instanceof Error
          ? submitRequestError.message
          : "Не вдалося створити запит",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Каталог програм"
        title="Пошук гуртків і програм"
        description="Виберіть програму, що може підтвердити позашкільне навчання дитини, а потім створіть запит на врахування до школи."
        actions={
          children.length === 0 ? (
            <Link
              href="/dashboard/children"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Спершу додайте дитину
            </Link>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SurfaceCard>
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="grid gap-2 lg:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="subject">
                  Предмет
                </label>
                <select
                  id="subject"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={filters.subject}
                  onChange={(event) =>
                    setFilters((currentValue) => ({
                      ...currentValue,
                      subject: event.target.value,
                    }))
                  }
                >
                  <option value="">Усі</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2 lg:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="city">
                  Місто
                </label>
                <input
                  id="city"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={filters.city}
                  onChange={(event) =>
                    setFilters((currentValue) => ({
                      ...currentValue,
                      city: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2 lg:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="age">
                  Вік
                </label>
                <input
                  id="age"
                  type="number"
                  min={4}
                  max={19}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={filters.age}
                  onChange={(event) =>
                    setFilters((currentValue) => ({
                      ...currentValue,
                      age: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2 lg:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="grade">
                  Клас
                </label>
                <input
                  id="grade"
                  type="number"
                  min={1}
                  max={12}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={filters.grade}
                  onChange={(event) =>
                    setFilters((currentValue) => ({
                      ...currentValue,
                      grade: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2 lg:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="search">
                  Пошук
                </label>
                <input
                  id="search"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((currentValue) => ({
                      ...currentValue,
                      search: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </SurfaceCard>

          {pageError ? (
            <SurfaceCard>
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            </SurfaceCard>
          ) : null}

          {programs.length === 0 ? (
            <EmptyState
              title="Нічого не знайдено"
              description="Спробуйте змінити фільтри або прибрати частину умов пошуку."
            />
          ) : (
            <div className="grid gap-4">
              {programs.map((program) => (
                <SurfaceCard key={program.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                        {program.subjectArea}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {program.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {program.shortDescription}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        selectedProgram?.id === program.id
                          ? "bg-blue-600 text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)]"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        setSelectedProgram(program);
                        setRequestForm((currentValue) => ({
                          ...currentValue,
                          targetSubject: program.subjectArea,
                        }));
                      }}
                    >
                      {selectedProgram?.id === program.id ? "Обрано" : "Створити запит"}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                      <div className="font-semibold text-slate-900">Клуб</div>
                      <div className="mt-1">
                        {program.club.name}
                        {program.club.city ? `, ${program.club.city}` : ""}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                      <div className="font-semibold text-slate-900">Підходить для</div>
                      <div className="mt-1">{describeProgramFit(program)}</div>
                    </div>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AdvisoryNote />

          {!selectedProgram ? (
            <EmptyState
              title="Оберіть програму"
              description="Після вибору програми праворуч відкриється форма запиту на врахування."
            />
          ) : children.length === 0 ? (
            <EmptyState
              title="Потрібен профіль дитини"
              description="Перед створенням запиту додайте дитину у відповідному розділі."
            />
          ) : (
            <SurfaceCard>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Новий запит на врахування
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ви створюєте запит для програми «{selectedProgram.title}». Після
                  надсилання збережеться AI-підсумок та стартовий статус запиту.
                </p>
              </div>

              <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="childId">
                    Дитина
                  </label>
                  <select
                    id="childId"
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={requestForm.childId}
                    onChange={(event) =>
                      setRequestForm((currentValue) => ({
                        ...currentValue,
                        childId: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Оберіть дитину</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.fullName} · {child.grade} клас
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="schoolId">
                    Школа
                  </label>
                  <select
                    id="schoolId"
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={requestForm.schoolId}
                    onChange={(event) =>
                      setRequestForm((currentValue) => ({
                        ...currentValue,
                        schoolId: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Оберіть школу</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                        {school.city ? `, ${school.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="targetSubject">
                      Цільовий предмет
                    </label>
                    <input
                      id="targetSubject"
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={requestForm.targetSubject}
                      onChange={(event) =>
                        setRequestForm((currentValue) => ({
                          ...currentValue,
                          targetSubject: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="targetGrade">
                      Клас для розгляду
                    </label>
                    <input
                      id="targetGrade"
                      type="number"
                      min={1}
                      max={12}
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={requestForm.targetGrade}
                      onChange={(event) =>
                        setRequestForm((currentValue) => ({
                          ...currentValue,
                          targetGrade: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="scope">
                    Обсяг розгляду
                  </label>
                  <select
                    id="scope"
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={requestForm.recognitionScope}
                    onChange={(event) =>
                      setRequestForm((currentValue) => ({
                        ...currentValue,
                        recognitionScope: event.target.value as "FULL" | "PARTIAL",
                      }))
                    }
                  >
                    <option value="PARTIAL">Часткове врахування</option>
                    <option value="FULL">Повне врахування для розгляду</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="parentNote">
                    Нотатка для школи
                  </label>
                  <textarea
                    id="parentNote"
                    className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={requestForm.parentNote}
                    onChange={(event) =>
                      setRequestForm((currentValue) => ({
                        ...currentValue,
                        parentNote: event.target.value,
                      }))
                    }
                    placeholder="Коротко поясніть контекст або очікування від шкільного розгляду."
                  />
                </div>

                {submitError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                ) : null}

                <button
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Створення..." : "Надіслати запит"}
                </button>
              </form>
            </SurfaceCard>
          )}
        </div>
      </div>
    </div>
  );
}
