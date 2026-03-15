"use client";

import { useEffect, useState } from "react";
import { Building2, Users, BookOpen, MapPin } from "lucide-react";
import {
  fetchParentRequests,
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
  useRoleAccess(["parent"]);

  const [requests, setRequests] = useState<RecognitionRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentRequests()
      .then((data) => {
        setRequests(data.requests);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ScreenSpinner />;
  }

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

  const uniqueClubCount = clubGroups.length;

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Батьківський кабінет"
        title="Гуртки"
        description="Тут ви бачите гуртки, які відвідують ваші діти, та статуси заявок на визнання."
      />

      {/* Metric summary */}
      <SurfaceCard>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Building2
              strokeWidth={2.1}
              className="h-5 w-5 text-blue-600"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Кількість гуртків
            </p>
            <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">
              {uniqueClubCount}
            </p>
          </div>
        </div>
      </SurfaceCard>

      {/* Empty state */}
      {clubGroups.length === 0 && (
        <EmptyState
          title="Гуртків поки немає"
          description="Коли ви створите заявки на визнання для своїх дітей, тут ви побачите пов'язані гуртки."
        />
      )}

      {/* Club cards */}
      <div className="space-y-6">
        {clubGroups.map((group) => (
          <SurfaceCard key={group.club.id}>
            <div>
              {/* Club header */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                    <Building2
                      strokeWidth={2.1}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                      {group.club.name}
                    </h3>
                    {group.club.city && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin
                          strokeWidth={2.1}
                          className="h-3.5 w-3.5"
                        />
                        {group.club.city}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject pills */}
                {group.club.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {group.club.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center rounded-2xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="mb-4 border-t border-slate-100" />

              {/* Requests list */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Заявки
                </p>
                {group.requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
                        <Users
                          strokeWidth={2.1}
                          className="h-4 w-4 text-slate-400"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {req.child.fullName}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <BookOpen
                            strokeWidth={2.1}
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          <span className="truncate">
                            {req.clubProgram.title}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="shrink-0">
                            {req.targetSubject}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-11 sm:ml-0">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
