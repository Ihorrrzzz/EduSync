"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Users, FileText } from "lucide-react";
import {
  fetchSchoolRequests,
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

interface GroupedStudent {
  childId: string;
  fullName: string;
  grade: number;
  requests: RecognitionRequestRecord[];
}

function groupByChild(
  requests: RecognitionRequestRecord[],
): GroupedStudent[] {
  const map = new Map<string, GroupedStudent>();

  for (const req of requests) {
    const existing = map.get(req.child.id);
    if (existing) {
      existing.requests.push(req);
    } else {
      map.set(req.child.id, {
        childId: req.child.id,
        fullName: req.child.fullName,
        grade: req.child.grade,
        requests: [req],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "uk"),
  );
}

function StudentRow({ student }: { student: GroupedStudent }) {
  const [expanded, setExpanded] = useState(false);

  const approvedCount = student.requests.filter(
    (r) => r.status === "APPROVED" || r.status === "PARTIALLY_APPROVED",
  ).length;
  const pendingCount = student.requests.filter(
    (r) =>
      r.status === "SUBMITTED" ||
      r.status === "AI_READY" ||
      r.status === "UNDER_REVIEW",
  ).length;

  return (
    <SurfaceCard className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50/60"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users strokeWidth={2.1} className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {student.fullName}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {student.grade} клас
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 sm:flex">
            <span className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {student.requests.length}
              </span>{" "}
              {student.requests.length === 1 ? "запит" : "запитів"}
            </span>
            {approvedCount > 0 && (
              <span className="text-xs text-emerald-600">
                {approvedCount} затверджено
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-xs text-amber-600">
                {pendingCount} на розгляді
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp
              strokeWidth={2.1}
              className="h-4 w-4 text-slate-400"
            />
          ) : (
            <ChevronDown
              strokeWidth={2.1}
              className="h-4 w-4 text-slate-400"
            />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/40">
          <div className="divide-y divide-slate-100">
            {student.requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {req.clubProgram.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {req.club.name} · {req.targetSubject}, {req.targetGrade} клас
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={req.status} />
                  <span className="text-xs text-slate-400">
                    {new Date(req.updatedAt).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

export default function SchoolStudentsPage() {
  useRoleAccess(["school"]);

  const [requests, setRequests] = useState<RecognitionRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchoolRequests()
      .then((data) => {
        setRequests(data.requests);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenSpinner />;

  const students = groupByChild(requests);
  const totalStudents = students.length;
  const totalRequests = requests.length;

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Шкільний кабінет"
        title="Учні"
        description="Перегляд учнів, які подали запити на визнання результатів навчання у гуртках."
      />

      {students.length === 0 ? (
        <EmptyState
          title="Учнів поки немає"
          description="Запити на визнання від учнів ще не надходили. Вони з'являться тут, коли батьки подадуть запити до вашої школи."
        />
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SurfaceCard>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Users strokeWidth={2.1} className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Унікальних учнів
                  </p>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                    {totalStudents}
                  </p>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FileText strokeWidth={2.1} className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Всього запитів
                  </p>
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                    {totalRequests}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          {/* Student list */}
          <div className="space-y-3">
            {students.map((student) => (
              <StudentRow key={student.childId} student={student} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
