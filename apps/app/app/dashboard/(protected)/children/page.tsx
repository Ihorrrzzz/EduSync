"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  EmptyState,
  PageHeading,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  createChild,
  deleteChild,
  fetchChildren,
  fetchSchools,
  updateChild,
  type ChildRecord,
  type SchoolCatalogItem,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

type ChildFormState = {
  fullName: string;
  age: string;
  grade: string;
  schoolId: string;
  notes: string;
};

const initialFormState: ChildFormState = {
  fullName: "",
  age: "",
  grade: "",
  schoolId: "",
  notes: "",
};

export default function DashboardChildrenPage() {
  const { me, isLoading, isAllowed, refreshMe } = useRoleAccess(["parent"]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [schools, setSchools] = useState<SchoolCatalogItem[]>([]);
  const [formState, setFormState] = useState<ChildFormState>(initialFormState);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const loadData = async () => {
    setIsFetching(true);
    setPageError("");

    try {
      const [childrenResponse, schoolsResponse] = await Promise.all([
        fetchChildren(),
        fetchSchools(),
      ]);
      setChildren(childrenResponse.children);
      setSchools(schoolsResponse.schools);
    } catch (loadError) {
      setPageError(
        loadError instanceof Error
          ? loadError.message
          : "Не вдалося завантажити сторінку",
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
  }, [isAllowed]);

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Ця сторінка доступна тільки для батьківського кабінету."
      />
    );
  }

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingChildId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setStatus("");
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formState.fullName.trim(),
        age: Number(formState.age),
        grade: Number(formState.grade),
        schoolId: formState.schoolId || null,
        notes: formState.notes.trim() || null,
      };

      if (editingChildId) {
        await updateChild(editingChildId, payload);
        setStatus("Дані дитини оновлено.");
      } else {
        await createChild(payload);
        setStatus("Дитину додано.");
      }

      resetForm();
      await loadData();
      await refreshMe();
    } catch (submitResultError) {
      setSubmitError(
        submitResultError instanceof Error
          ? submitResultError.message
          : "Не вдалося зберегти дані",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (child: ChildRecord) => {
    setEditingChildId(child.id);
    setFormState({
      fullName: child.fullName,
      age: String(child.age),
      grade: String(child.grade),
      schoolId: child.schoolId ?? "",
      notes: child.notes ?? "",
    });
    setSubmitError("");
    setStatus("");
  };

  const handleDelete = async (child: ChildRecord) => {
    if (!window.confirm(`Видалити профіль дитини «${child.fullName}»?`)) {
      return;
    }

    try {
      await deleteChild(child.id);
      setStatus("Профіль дитини видалено.");
      await loadData();
      await refreshMe();
    } catch (deleteError) {
      setSubmitError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не вдалося видалити профіль",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Дитина"
        title="Відомості про дитину"
        description="Тут ви додаєте дитину, оновлюєте її відомості, прив'язуєте школу та використовуєте профіль для нових запитів."
        actions={
          <Link
            href="/dashboard/discover"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            До каталогу програм
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {editingChildId ? "Редагування профілю" : "Додати дитину"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Якщо школа дитини вже є в системі, ви можете прив'язати її одразу. Інакше
            залиште поле порожнім і оберіть школу під час створення запиту.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
                ПІБ дитини
              </label>
              <input
                id="fullName"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    fullName: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="age">
                  Вік
                </label>
                <input
                  id="age"
                  type="number"
                  min={4}
                  max={19}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={formState.age}
                  onChange={(event) =>
                    setFormState((currentValue) => ({
                      ...currentValue,
                      age: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="grade">
                  Клас
                </label>
                <input
                  id="grade"
                  type="number"
                  min={1}
                  max={12}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  value={formState.grade}
                  onChange={(event) =>
                    setFormState((currentValue) => ({
                      ...currentValue,
                      grade: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="schoolId">
                Школа
              </label>
              <select
                id="schoolId"
                className="h-14 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.schoolId}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    schoolId: event.target.value,
                  }))
                }
              >
                <option value="">Без прив'язки</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                    {school.city ? `, ${school.city}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                Нотатки
              </label>
              <textarea
                id="notes"
                className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={formState.notes}
                onChange={(event) =>
                  setFormState((currentValue) => ({
                    ...currentValue,
                    notes: event.target.value,
                  }))
                }
                placeholder="Наприклад, сильні напрями або короткий контекст для школи."
              />
            </div>

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

            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Збереження..."
                  : editingChildId
                    ? "Оновити профіль"
                    : "Додати дитину"}
              </button>

              {editingChildId ? (
                <button
                  type="button"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={resetForm}
                >
                  Скасувати
                </button>
              ) : null}
            </div>
          </form>
        </SurfaceCard>

        <div className="space-y-4">
          {children.length === 0 ? (
            <EmptyState
              title="Ще немає дітей"
              description="Додайте дитину, щоб перейти до пошуку програм і створити перший запит."
            />
          ) : (
            children.map((child) => (
              <SurfaceCard key={child.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {child.fullName}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {child.age} років · {child.grade} клас
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => handleEdit(child)}
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      onClick={() => {
                        void handleDelete(child);
                      }}
                    >
                      Видалити
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                    <div className="font-semibold text-slate-900">Прив'язана школа</div>
                    <div className="mt-1">
                      {child.schoolNameSnapshot ?? "Школу ще не вибрано"}
                    </div>
                  </div>

                  {child.notes ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                      <div className="font-semibold text-slate-900">Нотатки</div>
                      <div className="mt-1">{child.notes}</div>
                    </div>
                  ) : null}
                </div>
              </SurfaceCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
