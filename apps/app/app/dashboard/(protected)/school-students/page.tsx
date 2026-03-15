"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText } from "lucide-react";
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

export default function SchoolStudentsPage() {
  useRoleAccess(["school"]);

  const [requests, setRequests] = useState<RecognitionRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchoolRequests()
      .then((data) => {
        setRequests(data.requests);
      })
      .catch(() => {
        setError("Не вдалося завантажити дані. Спробуйте оновити сторінку.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenSpinner />;

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeading
          eyebrow="Шкільний кабінет"
          title="Учні"
          description="Перегляд учнів, які подали запити на визнання результатів навчання у гуртках."
        />
        <SurfaceCard>
          <p className="text-sm text-red-600">{error}</p>
        </SurfaceCard>
      </div>
    );
  }

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

      {requests.length === 0 ? (
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

          {/* Requests table */}
          <SurfaceCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-3">Учень</th>
                    <th className="px-4 py-3">Клас</th>
                    <th className="px-4 py-3">Гурток</th>
                    <th className="px-4 py-3">Програма</th>
                    <th className="px-4 py-3">Предмет</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {req.child.fullName}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {req.child.grade}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {req.club.name}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Link
                          href={`/dashboard/review/detail?id=${req.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {req.clubProgram.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {req.targetSubject}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {new Date(req.updatedAt).toLocaleDateString("uk-UA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </>
      )}
    </div>
  );
}
