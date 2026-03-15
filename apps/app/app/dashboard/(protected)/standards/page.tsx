"use client";

import { Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  deleteSchoolModelPlan,
  fetchSchoolModelPlans,
  uploadSchoolModelPlan,
  type SchoolModelPlan,
} from "../../../../lib/mvp-api";
import { subjectOptions } from "../../../../lib/subject-options";
import { useRoleAccess } from "../../../../lib/use-role-access";

export default function DashboardStandardsPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["school"]);
  const [plans, setPlans] = useState<SchoolModelPlan[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [pageError, setPageError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectArea, setSubjectArea] = useState<string>(subjectOptions[0]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAllowed) return;

    const loadPlans = async () => {
      setIsFetching(true);
      setPageError("");

      try {
        const response = await fetchSchoolModelPlans();
        setPlans(response.plans);
      } catch (err) {
        setPageError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити стандарти",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadPlans();
  }, [isAllowed]);

  const handleUpload = async () => {
    if (!title.trim() || !file) return;

    setUploading(true);

    try {
      const response = await uploadSchoolModelPlan({
        title: title.trim(),
        subjectArea,
        file,
      });

      setPlans((prev) => [response.plan, ...prev]);
      setDialogOpen(false);
      setTitle("");
      setSubjectArea(subjectOptions[0]);
      setFile(null);
    } catch {
      // Upload failed silently for now
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await deleteSchoolModelPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Delete failed silently for now
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Управління стандартами доступне тільки для ролі школи."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Шкільний кабінет"
        title="Стандарти"
        description="Тут ви завантажуєте державні модельні програми за предметами для автоматичного порівняння з програмами гуртків."
        actions={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.1} />
            Завантажити стандарт
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

      {/* Upload dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60">
          <div className="mx-4 w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                Завантажити стандарт
              </h2>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="plan-title"
                >
                  Назва
                </label>
                <input
                  id="plan-title"
                  type="text"
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Назва модельної програми"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="plan-subject"
                >
                  Предмет
                </label>
                <select
                  id="plan-subject"
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={subjectArea}
                  onChange={(e) => setSubjectArea(e.target.value)}
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  PDF файл
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-600"
                >
                  {file ? (
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <Upload className="h-4 w-4" strokeWidth={2.1} />
                      {file.name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" strokeWidth={2.1} />
                      Натисніть для вибору PDF
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={uploading || !title.trim() || !file}
                onClick={() => void handleUpload()}
                className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Завантаження..." : "Завантажити"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans list */}
      {plans.length === 0 ? (
        <EmptyState
          title="Стандарти ще не завантажено"
          description="Завантажте державні модельні програми для автоматичного порівняння з програмами гуртків."
        />
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <SurfaceCard key={plan.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {plan.subjectArea}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Завантажено{" "}
                    {new Date(plan.createdAt).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={deletingId === plan.id}
                  onClick={() => void handleDelete(plan.id)}
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                </button>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
