"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "../../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../../components/screen-spinner";
import {
  fetchJournal,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type JournalEntryRecord,
  type JournalResponse,
} from "../../../../../lib/mvp-api";
import { subjectOptions } from "../../../../../lib/subject-options";
import { useRoleAccess } from "../../../../../lib/use-role-access";

type EntryFormState = {
  subject: string;
  scoreValue: string;
  scoreMax: string;
  comment: string;
  date: string;
};

const emptyForm: EntryFormState = {
  subject: subjectOptions[0],
  scoreValue: "",
  scoreMax: "",
  comment: "",
  date: new Date().toISOString().slice(0, 10),
};

function JournalContent() {
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId");
  const { me, isLoading, isAllowed } = useRoleAccess(["club"]);

  const [journal, setJournal] = useState<JournalResponse | null>(null);
  const [entries, setEntries] = useState<JournalEntryRecord[]>([]);
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isAllowed || !enrollmentId) {
      setIsFetching(false);
      return;
    }

    const load = async () => {
      setIsFetching(true);
      setPageError("");
      try {
        const data = await fetchJournal(enrollmentId);
        setJournal(data);
        setEntries(data.entries);
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Не вдалося завантажити журнал",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void load();
  }, [isAllowed, enrollmentId]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(entry: JournalEntryRecord) {
    setEditingId(entry.id);
    setForm({
      subject: entry.subject,
      scoreValue: String(entry.scoreValue),
      scoreMax: String(entry.scoreMax),
      comment: entry.comment ?? "",
      date: entry.date ? entry.date.slice(0, 10) : "",
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollmentId) return;

    const scoreValue = Number(form.scoreValue);
    const scoreMax = Number(form.scoreMax);

    if (!form.subject) {
      setFormError("Оберіть предмет");
      return;
    }
    if (!form.scoreValue || Number.isNaN(scoreValue) || scoreValue < 0) {
      setFormError("Введіть коректну оцінку");
      return;
    }
    if (!form.scoreMax || Number.isNaN(scoreMax) || scoreMax <= 0) {
      setFormError("Введіть максимальний бал");
      return;
    }
    if (scoreValue > scoreMax) {
      setFormError("Оцінка не може перевищувати максимальний бал");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const payload = {
      subject: form.subject,
      scoreValue,
      scoreMax,
      comment: form.comment || null,
      date: form.date || null,
    };

    try {
      if (editingId) {
        const { entry } = await updateJournalEntry(editingId, payload);
        setEntries((prev) =>
          prev.map((e) => (e.id === editingId ? entry : e)),
        );
      } else {
        const { entry } = await createJournalEntry(enrollmentId, payload);
        setEntries((prev) => [entry, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Не вдалося зберегти запис",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entryId: string) {
    setIsDeleting(true);
    try {
      await deleteJournalEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setDeletingId(null);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Не вдалося видалити запис",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Сторінка журналу доступна тільки для кабінету гуртка."
      />
    );
  }

  if (!enrollmentId) {
    return (
      <EmptyState
        title="Не вказано зарахування"
        description="Для перегляду журналу потрібно перейти зі сторінки учня."
      />
    );
  }

  const studentName = journal?.enrollment.child.fullName ?? "Учень";
  const programName = journal?.enrollment.clubProgram.title ?? "";

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Журнал"
        title={studentName}
        description={programName ? `Програма: ${programName}` : "Оцінки учня"}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,255,0.25)] transition hover:bg-blue-700"
            onClick={openAddForm}
          >
            <Plus className="h-4 w-4" strokeWidth={2.1} />
            Додати оцінку
          </button>
        }
      />

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      {showForm ? (
        <SurfaceCard>
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Редагувати оцінку" : "Нова оцінка"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Предмет
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 h-14"
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
              >
                {subjectOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Оцінка
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 h-14"
                  placeholder="0"
                  value={form.scoreValue}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, scoreValue: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Максимальний бал
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 h-14"
                  placeholder="12"
                  value={form.scoreMax}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, scoreMax: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Коментар
              </label>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 h-14"
                placeholder="Необов'язковий коментар"
                value={form.comment}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comment: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Дата
              </label>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 h-14"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>

            {formError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,255,0.25)] transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Збереження..."
                  : editingId
                    ? "Зберегти зміни"
                    : "Додати"}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={closeForm}
              >
                Скасувати
              </button>
            </div>
          </form>
        </SurfaceCard>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="Журнал порожній"
          description="Додайте першу оцінку, натиснувши кнопку вище."
        />
      ) : (
        <SurfaceCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Предмет</th>
                  <th className="px-4 py-3">Оцінка</th>
                  <th className="px-4 py-3">Коментар</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {entry.subject}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {entry.scoreValue} / {entry.scoreMax}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {entry.comment || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {entry.date
                        ? new Date(entry.date).toLocaleDateString("uk-UA")
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                          title="Редагувати"
                          onClick={() => openEditForm(entry)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2.1} />
                        </button>

                        {deletingId === entry.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isDeleting}
                              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                              onClick={() => void handleDelete(entry.id)}
                            >
                              {isDeleting ? "..." : "Так"}
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              onClick={() => setDeletingId(null)}
                            >
                              Ні
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Видалити"
                            onClick={() => setDeletingId(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                          </button>
                        )}
                      </div>
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

export default function DashboardStudentJournalPage() {
  return (
    <Suspense fallback={<ScreenSpinner />}>
      <JournalContent />
    </Suspense>
  );
}
