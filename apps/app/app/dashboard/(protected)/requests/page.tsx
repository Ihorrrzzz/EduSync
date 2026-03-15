"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BandBadge,
  EmptyState,
  PageHeading,
  StatusBadge,
  SurfaceCard,
} from "../../../../components/dashboard-shell";
import { ScreenSpinner } from "../../../../components/screen-spinner";
import {
  fetchClubRequests,
  fetchParentRequests,
  type ClubRequestRecord,
  type RecognitionRequestRecord,
} from "../../../../lib/mvp-api";
import { useRoleAccess } from "../../../../lib/use-role-access";

export default function DashboardRequestsPage() {
  const { me, isLoading, isAllowed } = useRoleAccess(["parent", "club"]);
  const [parentRequests, setParentRequests] = useState<RecognitionRequestRecord[]>([]);
  const [clubRequests, setClubRequests] = useState<ClubRequestRecord[]>([]);
  const [pageError, setPageError] = useState("");
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!me || !isAllowed) {
      return;
    }

    const loadData = async () => {
      setIsFetching(true);
      setPageError("");

      try {
        if (me.profile.role === "parent") {
          const response = await fetchParentRequests();
          setParentRequests(response.requests);
        } else {
          const response = await fetchClubRequests();
          setClubRequests(response.requests);
        }
      } catch (loadError) {
        setPageError(
          loadError instanceof Error
            ? loadError.message
            : "Не вдалося завантажити запити",
        );
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [isAllowed, me]);

  if (isLoading || isFetching) {
    return <ScreenSpinner />;
  }

  if (!me || !isAllowed) {
    return (
      <EmptyState
        title="Розділ недоступний"
        description="Ця сторінка доступна для батьківського кабінету та кабінету гуртка."
      />
    );
  }

  const isParent = me.profile.role === "parent";
  const records = isParent ? parentRequests : clubRequests;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Запити"
        title={isParent ? "Ваші запити на врахування" : "Запити до програм гуртка"}
        description={
          isParent
            ? "Тут видно статус, короткий AI-підсумок, рішення школи та перехід до детальної картки запиту."
            : "Використовуйте цей список, щоб додавати підсумок доказів та стежити, де школа вже залишила рішення."
        }
        actions={
          isParent ? (
            <Link
              href="/dashboard/discover"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Створити новий запит
            </Link>
          ) : (
            <Link
              href="/dashboard/programs"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Перейти до програм
            </Link>
          )
        }
      />

      {pageError ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        </SurfaceCard>
      ) : null}

      {records.length === 0 ? (
        <EmptyState
          title="Поки немає запитів"
          description={
            isParent
              ? "Створіть перший запит на врахування після вибору програми з каталогу."
              : "Коли батьки оберуть одну з ваших програм, запит з'явиться тут."
          }
        />
      ) : (
        <div className="grid gap-4">
          {records.map((request) => {
            if (isParent) {
              const parentRequest = request as RecognitionRequestRecord;

              return (
                <SurfaceCard key={parentRequest.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                        {parentRequest.targetSubject} · {parentRequest.targetGrade} клас
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {parentRequest.clubProgram.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {parentRequest.school.name} розглядає пакет від{" "}
                        {parentRequest.club.name}.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={parentRequest.status} />
                      {parentRequest.aiAnalysis ? (
                        <BandBadge band={parentRequest.aiAnalysis.recommendationBand} />
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                      <div className="font-semibold text-slate-900">Програма та клуб</div>
                      <div className="mt-1">
                        {parentRequest.club.name} · {parentRequest.clubProgram.shortDescription}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                      <div className="font-semibold text-slate-900">AI-підсумок</div>
                      <div className="mt-1">
                        {parentRequest.aiAnalysis?.summary ?? "AI-підсумок ще не згенеровано."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/requests/detail?id=${parentRequest.id}`}
                      className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
                    >
                      Відкрити деталі
                    </Link>
                  </div>
                </SurfaceCard>
              );
            }

            const clubRequest = request as ClubRequestRecord;

            return (
              <SurfaceCard key={clubRequest.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {clubRequest.targetSubject} · {clubRequest.targetGrade} клас
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {clubRequest.child.fullName} · {clubRequest.clubProgram.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {clubRequest.school.name} отримала запит від{" "}
                      {clubRequest.parent.displayName}.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={clubRequest.status} />
                    {clubRequest.aiAnalysis ? (
                      <BandBadge band={clubRequest.aiAnalysis.recommendationBand} />
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                    <div className="font-semibold text-slate-900">Родина та школа</div>
                    <div className="mt-1">
                      {clubRequest.parent.displayName} · {clubRequest.school.name}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                    <div className="font-semibold text-slate-900">AI-підсумок</div>
                    <div className="mt-1">
                      {clubRequest.aiAnalysis?.summary ?? "AI-підсумок ще не згенеровано."}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/requests/detail?id=${clubRequest.id}`}
                    className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,255,0.22)] transition hover:bg-blue-700"
                  >
                    Відкрити деталі
                  </Link>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
