"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Send, Trash2, Upload, X } from "lucide-react";
import {
  EmptyState,
  PageHeading,
  StatusBadge,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  createProgramReview,
  createQuickProgram,
  deleteProgram,
  fetchPrograms,
  fetchSchools,
  uploadProgramFile,
  type ProgramRecord,
  type SchoolCatalogItem,
} from "../../../../lib/mvp-api";
import { subjectOptions } from "../../../../lib/subject-options";
import { useRoleAccess } from "../../../../lib/use-role-access";

export default function DashboardProgramsPage() {
  const { me, isLoading, isAllowed, refreshMe } = useRoleAccess(["club"]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createAudience, setCreateAudience] = useState("");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review dialog state
  const [showReview, setShowReview] = useState(false);
  const [reviewProgramId, setReviewProgramId] = useState("");
  const [reviewSchoolId, setReviewSchoolId] = useState("");
  const [schools, setSchools] = useState<SchoolCatalogItem[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const loadPrograms = async () => {
    setIsFetching(true);
    setPageError("");
    try {
      const response = await fetchPrograms();
      setPrograms(response.programs);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Не вдалося завантажити програми");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) return;
    void loadPrograms();
  }, [isAllowed]);

  if (isLoading || isFetching) return <ScreenSpinner />;
  if (!me || !isAllowed) {
    return <EmptyState title="Розділ недоступний" description="Сторінка програм працює тільки для кабінету гуртка." />;
  }

  const handleCreate = async () => {
    setCreateError("");
    setCreateSubmitting(true);
    try {
      const response = await createQuickProgram({
        title: createTitle,
        subjectArea: createSubject,
        audience: createAudience || null,
      });
      if (createFile) {
        await uploadProgramFile(response.program.id, createFile);
      }
      await loadPrograms();
      await refreshMe();
      setShowCreate(false);
      setCreateTitle("");
      setCreateSubject("");
      setCreateAudience("");
      setCreateFile(null);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Не вдалося створити програму");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError("");
    try {
      await deleteProgram(id);
      setDeletingId(null);
      await loadPrograms();
      await refreshMe();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Не вдалося видалити програму");
    }
  };

  const openReviewDialog = async (programId: string) => {
    setReviewProgramId(programId);
    setReviewSchoolId("");
    setReviewError("");
    setShowReview(true);
    try {
      const response = await fetchSchools();
      setSchools(response.schools);
    } catch {
      setSchools([]);
    }
  };

  const handleSendReview = async () => {
    setReviewError("");
    setReviewSubmitting(true);
    try {
      await createProgramReview({
        clubProgramId: reviewProgramId,
        schoolId: reviewSchoolId,
      });
      setShowReview(false);
      await loadPrograms();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Не вдалося надіслати запит");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Програми гуртка"
        title="Ваші програми"
        description="Додайте програми, завантажте PDF-документ та надішліть на розгляд школі."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={2.1} />
            Додати програму
          </button>
        }
      />

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">Нова програма</h2>
              <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={() => setShowCreate(false)}>
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="createTitle">Назва програми</label>
                <input id="createTitle" className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="createSubject">Предмет</label>
                <select id="createSubject" className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} required>
                  <option value="">Оберіть предмет</option>
                  {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="createAudience">Аудиторія</label>
                <input id="createAudience" className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={createAudience} onChange={(e) => setCreateAudience(e.target.value)} placeholder="напр. 5-11 клас або вік 10-16" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">PDF програми</label>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)} />
                {createFile ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <FileText className="h-5 w-5 text-blue-600" strokeWidth={2.1} />
                    <span className="flex-1 truncate text-sm text-slate-700">{createFile.name}</span>
                    <button type="button" className="rounded-lg p-1 text-slate-400 hover:text-slate-600" onClick={() => { setCreateFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mx-auto h-6 w-6 text-slate-400" strokeWidth={2.1} />
                    <span className="mt-2 block text-sm text-slate-500">Натисніть, щоб обрати PDF файл</span>
                  </button>
                )}
              </div>
              {createError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 rounded-2xl border border-slate-200 h-14 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setShowCreate(false)}>Скасувати</button>
                <button type="button" className="flex-1 bg-blue-600 text-white rounded-2xl h-14 px-5 text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={createSubmitting || !createTitle || !createSubject} onClick={handleCreate}>
                  {createSubmitting ? "Створення..." : "Створити програму"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">Надіслати на розгляд</h2>
              <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={() => setShowReview(false)}>
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="reviewSchool">Оберіть школу</label>
                <select id="reviewSchool" className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={reviewSchoolId} onChange={(e) => setReviewSchoolId(e.target.value)} required>
                  <option value="">Оберіть школу</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? `, ${s.city}` : ""}</option>)}
                </select>
              </div>
              {reviewError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{reviewError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 rounded-2xl border border-slate-200 h-14 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setShowReview(false)}>Скасувати</button>
                <button type="button" className="flex-1 bg-blue-600 text-white rounded-2xl h-14 px-5 text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={reviewSubmitting || !reviewSchoolId} onClick={handleSendReview}>
                  {reviewSubmitting ? "Надсилання..." : "Надіслати"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pageError && (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
        </SurfaceCard>
      )}

      {deleteError && (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>
        </SurfaceCard>
      )}

      {programs.length === 0 ? (
        <EmptyState title="Ще немає програм" description="Додайте вашу першу програму за допомогою кнопки вище." />
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <SurfaceCard key={program.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{program.subjectArea}</div>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950">{program.title}</h3>
                  {program.audience && (
                    <p className="mt-1 text-sm text-slate-500">Аудиторія: {program.audience}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={program.isPublished ? "APPROVED" : "DRAFT"} />
                    {program.programFileUrl && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        <FileText className="h-3 w-3" strokeWidth={2.1} />
                        PDF
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => openReviewDialog(program.id)}
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={2.1} />
                    На розгляд
                  </button>
                  {deletingId === program.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={() => handleDelete(program.id)}
                      >
                        Так, видалити
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => setDeletingId(null)}
                      >
                        Ні
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      onClick={() => setDeletingId(program.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.1} />
                      Видалити
                    </button>
                  )}
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
