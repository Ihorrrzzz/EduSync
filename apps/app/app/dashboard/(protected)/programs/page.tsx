"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AdvisoryNote,
  BandBadge,
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  createProgram,
  fetchPrograms,
  runProgramAiPreview,
  updateProgram,
  type AiAnalysisRecord,
  type ProgramRecord,
} from "../../../../lib/mvp-api";
import { subjectOptions } from "../../../../lib/subject-options";
import { useRoleAccess } from "../../../../lib/use-role-access";

type ProgramFormState = {
  title: string;
  subjectArea: string;
  shortDescription: string;
  fullDescription: string;
  ageMin: string;
  ageMax: string;
  gradeMin: string;
  gradeMax: string;
  modulesText: string;
  learningOutcomesText: string;
  evaluationMethod: string;
  reportFormatSummary: string;
  isPublished: boolean;
};

const initialProgramForm: ProgramFormState = {
  title: "",
  subjectArea: "",
  shortDescription: "",
  fullDescription: "",
  ageMin: "",
  ageMax: "",
  gradeMin: "",
  gradeMax: "",
  modulesText: "",
  learningOutcomesText: "",
  evaluationMethod: "",
  reportFormatSummary: "",
  isPublished: false,
};

function joinLines(lines: string[]) {
  return lines.join("\n");
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function DashboardProgramsPage() {
  const { me, isLoading, isAllowed, refreshMe } = useRoleAccess(["club"]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [formState, setFormState] = useState<ProgramFormState>(initialProgramForm);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramRecord | null>(null);
  const [previewTargetSubject, setPreviewTargetSubject] = useState("");
  const [previewTargetGrade, setPreviewTargetGrade] = useState("");
  const [previewScope, setPreviewScope] = useState<"FULL" | "PARTIAL">("PARTIAL");
  const [previewResult, setPreviewResult] = useState<AiAnalysisRecord | null>(null);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [status, setStatus] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const loadPrograms = async () => {
    setIsFetching(true);
    setPageError("");

    try {
      const response = await fetchPrograms();
      setPrograms(response.programs);
      setSelectedProgram((currentValue) =>
        currentValue
          ? response.programs.find((program) => program.id === currentValue.id) ?? null
          : response.programs[0] ?? null,
      );
    } catch (loadError) {
      setPageError(
        loadError instanceof Error
          ? loadError.message
          : "Не вдалося завантажити програми",
      );
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) {
      return;
    }

    void loadPrograms();
  }, [isAllowed]);

  useEffect(() => {
    if (!selectedProgram) {
      return;
    }

    setPreviewTargetSubject(selectedProgram.subjectArea);
    setPreviewTargetGrade(
      selectedProgram.gradeMin ? String(selectedProgram.gradeMin) : "",
    );
  }, [selectedProgram]);

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Сторінка програм працює тільки для кабінету гуртка."
      />
    );
  }

  const resetForm = () => {
    setFormState(initialProgramForm);
    setEditingProgramId(null);
    setSubmitError("");
    setStatus("");
  };

  const handleEdit = (program: ProgramRecord) => {
    setEditingProgramId(program.id);
    setSelectedProgram(program);
    setFormState({
      title: program.title,
      subjectArea: program.subjectArea,
      shortDescription: program.shortDescription,
      fullDescription: program.fullDescription,
      ageMin: program.ageMin !== null ? String(program.ageMin) : "",
      ageMax: program.ageMax !== null ? String(program.ageMax) : "",
      gradeMin: program.gradeMin !== null ? String(program.gradeMin) : "",
      gradeMax: program.gradeMax !== null ? String(program.gradeMax) : "",
      modulesText: joinLines(program.modules),
      learningOutcomesText: joinLines(program.learningOutcomes),
      evaluationMethod: program.evaluationMethod,
      reportFormatSummary: program.reportFormatSummary ?? "",
      isPublished: program.isPublished,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setStatus("");
    setIsSubmitting(true);

    try {
      const payload = {
        title: formState.title,
        subjectArea: formState.subjectArea,
        shortDescription: formState.shortDescription,
        fullDescription: formState.fullDescription,
        ageMin: formState.ageMin ? Number(formState.ageMin) : null,
        ageMax: formState.ageMax ? Number(formState.ageMax) : null,
        gradeMin: formState.gradeMin ? Number(formState.gradeMin) : null,
        gradeMax: formState.gradeMax ? Number(formState.gradeMax) : null,
        modules: splitLines(formState.modulesText),
        learningOutcomes: splitLines(formState.learningOutcomesText),
        evaluationMethod: formState.evaluationMethod,
        reportFormatSummary: formState.reportFormatSummary || null,
        isPublished: formState.isPublished,
      };

      if (editingProgramId) {
        await updateProgram(editingProgramId, payload);
        setStatus("Програму оновлено.");
      } else {
        await createProgram(payload);
        setStatus("Програму створено.");
      }

      resetForm();
      await loadPrograms();
      await refreshMe();
    } catch (submitProgramError) {
      setSubmitError(
        submitProgramError instanceof Error
          ? submitProgramError.message
          : "Не вдалося зберегти програму",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProgram) {
      return;
    }

    setIsPreviewing(true);

    try {
      const response = await runProgramAiPreview(selectedProgram.id, {
        targetSubject: previewTargetSubject,
        targetGrade: Number(previewTargetGrade),
        recognitionScope: previewScope,
      });
      setPreviewResult(response.analysis);
    } catch (previewError) {
      setSubmitError(
        previewError instanceof Error
          ? previewError.message
          : "Не вдалося отримати AI-аналіз",
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Програми гуртка"
        title="Структуруйте програму для шкільного розгляду"
        description="Додайте модулі, очікувані результати навчання, спосіб оцінювання і тримайте опубліковану версію каталогу в актуальному стані."
        actions={
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Запити до програм
          </Link>
        }
      />

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {editingProgramId ? "Редагування програми" : "Нова програма"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Використовуйте короткі, але перевірні формулювання. Школа бачитиме саме ці поля.
              </p>
            </div>

            {editingProgramId ? (
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={resetForm}
              >
                Скасувати
              </button>
            ) : null}
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="title">
                Назва програми
              </label>
              <input
                id="title"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.title}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    title: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="subjectArea">
                  Предметний напрям
                </label>
                <select
                  id="subjectArea"
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={formState.subjectArea}
                  onChange={(event) =>
                    setFormState((currentValue) => ({
                      ...currentValue,
                      subjectArea: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Оберіть напрям</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="shortDescription">
                  Короткий опис
                </label>
                <input
                  id="shortDescription"
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={formState.shortDescription}
                  onChange={(event) =>
                    setFormState((currentValue) => ({
                      ...currentValue,
                      shortDescription: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullDescription">
                Повний опис
              </label>
              <textarea
                id="fullDescription"
                className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.fullDescription}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    fullDescription: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="ageMin">
                  Вік від / до
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="ageMin"
                    type="number"
                    min={4}
                    max={19}
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={formState.ageMin}
                    onChange={(event) =>
                      setFormState((currentValue) => ({
                        ...currentValue,
                        ageMin: event.target.value,
                      }))
                    }
                    placeholder="від"
                  />
                  <input
                    type="number"
                    min={4}
                    max={19}
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={formState.ageMax}
                    onChange={(event) =>
                      setFormState((currentValue) => ({
                        ...currentValue,
                        ageMax: event.target.value,
                      }))
                    }
                    placeholder="до"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="gradeMin">
                  Клас від / до
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="gradeMin"
                    type="number"
                    min={1}
                    max={12}
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={formState.gradeMin}
                    onChange={(event) =>
                      setFormState((currentValue) => ({
                        ...currentValue,
                        gradeMin: event.target.value,
                      }))
                    }
                    placeholder="від"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={formState.gradeMax}
                    onChange={(event) =>
                      setFormState((currentValue) => ({
                        ...currentValue,
                        gradeMax: event.target.value,
                      }))
                    }
                    placeholder="до"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="modulesText">
                Модулі
              </label>
              <textarea
                id="modulesText"
                className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.modulesText}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    modulesText: event.target.value,
                  }))
                }
                placeholder="Один модуль на рядок"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="learningOutcomesText">
                Результати навчання
              </label>
              <textarea
                id="learningOutcomesText"
                className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.learningOutcomesText}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    learningOutcomesText: event.target.value,
                  }))
                }
                placeholder="Один результат навчання на рядок"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="evaluationMethod">
                Спосіб оцінювання
              </label>
              <textarea
                id="evaluationMethod"
                className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.evaluationMethod}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    evaluationMethod: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="reportFormatSummary">
                Формат звіту
              </label>
              <input
                id="reportFormatSummary"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.reportFormatSummary}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    reportFormatSummary: event.target.value,
                  }))
                }
              />
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formState.isPublished}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    isPublished: event.target.checked,
                  }))
                }
              />
              Опублікувати програму в каталозі
            </label>

            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            {status ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            ) : null}

            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Збереження..."
                : editingProgramId
                  ? "Оновити програму"
                  : "Створити програму"}
            </button>
          </form>
        </SurfaceCard>

        <div className="space-y-6">
          <AdvisoryNote />

          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Ваші програми
            </h2>
            <div className="mt-6 space-y-4">
              {programs.length === 0 ? (
                <EmptyState
                  title="Ще немає програм"
                  description="Створіть першу програму, щоб додати її до каталогу та запускати AI-аналіз."
                />
              ) : (
                programs.map((program) => (
                  <div
                    key={program.id}
                    className={`rounded-2xl border px-4 py-4 ${
                      selectedProgram?.id === program.id
                        ? "border-blue-200 bg-blue-50/80"
                        : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                          {program.subjectArea}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-950">
                          {program.title}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-600">
                          {program.shortDescription}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          onClick={() => setSelectedProgram(program)}
                        >
                          Обрати
                        </button>
                        <button
                          type="button"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          onClick={() => handleEdit(program)}
                        >
                          Редагувати
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {program.isPublished ? "Опубліковано" : "Чернетка"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              AI-попередній аналіз
            </h2>
            {selectedProgram ? (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Перевірте, як виглядає рекомендаційний рівень для обраної програми ще
                  до подачі батьківського запиту.
                </p>

                <form className="mt-6 grid gap-4" onSubmit={handlePreviewSubmit}>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="previewSubject">
                      Цільовий предмет
                    </label>
                    <input
                      id="previewSubject"
                      className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={previewTargetSubject}
                      onChange={(event) => setPreviewTargetSubject(event.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="previewGrade">
                        Клас
                      </label>
                      <input
                        id="previewGrade"
                        type="number"
                        min={1}
                        max={12}
                        className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        value={previewTargetGrade}
                        onChange={(event) => setPreviewTargetGrade(event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="previewScope">
                        Обсяг розгляду
                      </label>
                      <select
                        id="previewScope"
                        className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        value={previewScope}
                        onChange={(event) =>
                          setPreviewScope(event.target.value as "FULL" | "PARTIAL")
                        }
                      >
                        <option value="PARTIAL">Часткове врахування</option>
                        <option value="FULL">Повне врахування для розгляду</option>
                      </select>
                    </div>
                  </div>

                  <button
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    type="submit"
                    disabled={isPreviewing}
                  >
                    {isPreviewing ? "Аналіз..." : "Запустити AI-аналіз"}
                  </button>
                </form>

                {previewResult ? (
                  <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <BandBadge band={previewResult.recommendationBand} />
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Сумісність: {previewResult.compatibilityScore}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                      <div className="font-semibold text-slate-900">Підсумок</div>
                      <div className="mt-1">{previewResult.summary}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                      <div className="font-semibold text-slate-900">Покриті результати</div>
                      <div className="mt-1">{previewResult.matchedOutcomes.join(" • ")}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                      <div className="font-semibold text-slate-900">Прогалини</div>
                      <div className="mt-1">{previewResult.gaps.join(" • ")}</div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Оберіть програму"
                description="AI-аналіз працює для однієї збереженої програми з вашого списку."
              />
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
