"use client";

import { useEffect, useState } from "react";
import { Building2, Users, BookOpen, MapPin, Plus, X } from "lucide-react";
import {
  createEnrollment,
  fetchCatalogPrograms,
  fetchChildren,
  fetchParentEnrollments,
  fetchParentRequests,
  type ChildRecord,
  type EnrollmentRecord,
  type ProgramRecord,
  type RecognitionRequestRecord,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";
import {
  PageHeading,
  SurfaceCard,
  EmptyState,
  StatusBadge,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";

interface ClubGroup {
  club: RecognitionRequestRecord["club"];
  requests: RecognitionRequestRecord[];
}

export default function ClubsPage() {
  const { isAllowed } = useRoleAccess(["parent"]);

  const [requests, setRequests] = useState<RecognitionRequestRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Enroll dialog
  const [showEnroll, setShowEnroll] = useState(false);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [enrollProgramId, setEnrollProgramId] = useState("");
  const [enrollChildId, setEnrollChildId] = useState("");
  const [enrollNote, setEnrollNote] = useState("");
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, enrData] = await Promise.all([
        fetchParentRequests(),
        fetchParentEnrollments(),
      ]);
      setRequests(reqData.requests);
      setEnrollments(enrData.enrollments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAllowed) return;
    void loadData();
  }, [isAllowed]);

  if (loading) return <ScreenSpinner />;

  const clubGroups: ClubGroup[] = [];
  const clubMap = new Map<string, ClubGroup>();

  for (const req of requests) {
    const existing = clubMap.get(req.club.id);
    if (existing) {
      existing.requests.push(req);
    } else {
      const group: ClubGroup = { club: req.club, requests: [req] };
      clubMap.set(req.club.id, group);
      clubGroups.push(group);
    }
  }

  const openEnrollDialog = async () => {
    setShowEnroll(true);
    setEnrollProgramId("");
    setEnrollChildId("");
    setEnrollNote("");
    setEnrollError("");
    try {
      const [programsRes, childrenRes] = await Promise.all([
        fetchCatalogPrograms(),
        fetchChildren(),
      ]);
      setPrograms(programsRes.programs);
      setChildren(childrenRes.children);
    } catch {
      setPrograms([]);
      setChildren([]);
    }
  };

  const handleEnroll = async () => {
    setEnrollError("");
    setEnrollSubmitting(true);
    try {
      await createEnrollment({
        childId: enrollChildId,
        clubProgramId: enrollProgramId,
        note: enrollNote.trim() || null,
      });
      setShowEnroll(false);
      await loadData();
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Не вдалося записатися");
    } finally {
      setEnrollSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Батьківський кабінет"
        title="Гуртки"
        description="Тут ви бачите гуртки, записи дитини та статуси заявок."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
            onClick={openEnrollDialog}
          >
            <Plus className="h-4 w-4" strokeWidth={2.1} />
            Записатися до гуртка
          </button>
        }
      />

      {/* Enroll Dialog */}
      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">Записатися до програми</h2>
              <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" onClick={() => setShowEnroll(false)}>
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="enrollChild">Дитина</label>
                <select id="enrollChild" className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={enrollChildId} onChange={(e) => setEnrollChildId(e.target.value)} required>
                  <option value="">Оберіть дитину</option>
                  {children.map((c) => <option key={c.id} value={c.id}>{c.fullName} · {c.grade} клас</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="enrollProgram">Програма</label>
                <select id="enrollProgram" className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={enrollProgramId} onChange={(e) => setEnrollProgramId(e.target.value)} required>
                  <option value="">Оберіть програму</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.club.name}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="enrollNote">Нотатка (необов&apos;язково)</label>
                <textarea id="enrollNote" className="min-h-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={enrollNote} onChange={(e) => setEnrollNote(e.target.value)} placeholder="Коротко про очікування або побажання" />
              </div>
              {enrollError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{enrollError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" className="flex-1 rounded-2xl border border-slate-200 h-14 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setShowEnroll(false)}>Скасувати</button>
                <button type="button" className="flex-1 bg-blue-600 text-white rounded-2xl h-14 text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={enrollSubmitting || !enrollChildId || !enrollProgramId} onClick={handleEnroll}>
                  {enrollSubmitting ? "Відправка..." : "Записатися"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments section */}
      {enrollments.length > 0 && (
        <SurfaceCard>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Записи до гуртків</h2>
          <div className="mt-4 space-y-3">
            {enrollments.map((enr) => (
              <div key={enr.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{enr.child.fullName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{enr.clubProgram.title} — {enr.club.name}</p>
                </div>
                <StatusBadge status={enr.status} />
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Metric summary */}
      <SurfaceCard>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Building2 strokeWidth={2.1} className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Кількість гуртків</p>
            <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">{clubGroups.length}</p>
          </div>
        </div>
      </SurfaceCard>

      {clubGroups.length === 0 && enrollments.length === 0 && (
        <EmptyState title="Гуртків поки немає" description="Коли ви створите заявки або запишетеся до гуртка, тут ви побачите інформацію." />
      )}

      <div className="space-y-6">
        {clubGroups.map((group) => (
          <SurfaceCard key={group.club.id}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                  <Building2 strokeWidth={2.1} className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">{group.club.name}</h3>
                  {group.club.city && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin strokeWidth={2.1} className="h-3.5 w-3.5" />
                      {group.club.city}
                    </div>
                  )}
                </div>
              </div>
              {group.club.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {group.club.subjects.map((subject) => (
                    <span key={subject} className="inline-flex items-center rounded-2xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{subject}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4 border-t border-slate-100" />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Заявки</p>
              {group.requests.map((req) => (
                <div key={req.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
                      <Users strokeWidth={2.1} className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{req.child.fullName}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <BookOpen strokeWidth={2.1} className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{req.clubProgram.title}</span>
                        <span className="text-slate-300">·</span>
                        <span className="shrink-0">{req.targetSubject}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-11 sm:ml-0">
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
