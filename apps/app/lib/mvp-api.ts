/**
 * Typed API client — all endpoint wrappers and response types for the dashboard.
 * Each function maps 1:1 to an API route, keeping networking details out of components.
 */
"use client";

import {
  apiFetch,
  type Profile,
  type ProfileRole,
} from "./api";

export type DashboardMe = {
  profile: Profile;
  account: {
    entityId: string;
    displayName: string;
    city: string | null;
    subjects: string[];
  };
  summary: Record<string, number>;
};

export type SchoolCatalogItem = {
  id: string;
  name: string;
  city: string | null;
};

export type ChildRecord = {
  id: string;
  fullName: string;
  age: number;
  grade: number;
  schoolId: string | null;
  schoolNameSnapshot: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  school: SchoolCatalogItem | null;
};

export type ProgramRecord = {
  id: string;
  clubId: string;
  title: string;
  subjectArea: string;
  shortDescription: string;
  fullDescription: string;
  ageMin: number | null;
  ageMax: number | null;
  gradeMin: number | null;
  gradeMax: number | null;
  modules: string[];
  learningOutcomes: string[];
  evaluationMethod: string;
  reportFormatSummary: string | null;
  programFileUrl: string | null;
  audience: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  club: {
    id: string;
    name: string;
    city: string | null;
    subjects: string[];
  };
};

export type AiAnalysisRecord = {
  id?: string;
  provider: string | null;
  modelName: string | null;
  compatibilityScore: number;
  recommendationBand: "strong" | "possible" | "weak";
  recommendedSchoolAction: "full_candidate" | "partial_candidate" | "manual_review";
  confidence: "high" | "medium" | "low";
  summary: string;
  matchedOutcomes: string[];
  gaps: string[];
  suggestedEvidence: string[];
  safeBandExplanation: string;
  createdAt?: string;
};

export type DecisionRecord = {
  id: string;
  schoolId: string;
  decision: "APPROVE" | "PARTIAL" | "REQUEST_CHANGES" | "REJECT";
  comment: string;
  recognizedTopics: string[];
  decidedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RecognitionRequestRecord = {
  id: string;
  parentProfileId: string;
  childId: string;
  schoolId: string;
  clubId: string;
  clubProgramId: string;
  targetSubject: string;
  targetGrade: number;
  recognitionScope: "FULL" | "PARTIAL";
  parentNote: string | null;
  clubEvidenceSummary: string | null;
  attendanceRate: number | null;
  externalPerformanceBand: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "AI_READY"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "PARTIALLY_APPROVED"
    | "CHANGES_REQUESTED"
    | "REJECTED";
  createdAt: string;
  updatedAt: string;
  child: ChildRecord;
  school: SchoolCatalogItem;
  club: {
    id: string;
    name: string;
    city: string | null;
    subjects: string[];
  };
  clubProgram: ProgramRecord;
  aiAnalysis: AiAnalysisRecord | null;
  decision: DecisionRecord | null;
};

export type ClubRequestRecord = {
  id: string;
  parentProfileId: string;
  childId: string;
  schoolId: string;
  clubId: string;
  clubProgramId: string;
  targetSubject: string;
  targetGrade: number;
  recognitionScope: "FULL" | "PARTIAL";
  parentNote: string | null;
  clubEvidenceSummary: string | null;
  attendanceRate: number | null;
  externalPerformanceBand: string | null;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "AI_READY"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "PARTIALLY_APPROVED"
    | "CHANGES_REQUESTED"
    | "REJECTED";
  createdAt: string;
  updatedAt: string;
  child: ChildRecord;
  school: SchoolCatalogItem;
  clubProgram: {
    id: string;
    title: string;
    subjectArea: string;
    shortDescription: string;
  };
  parent: {
    displayName: string;
    email: string;
  };
  aiAnalysis: AiAnalysisRecord | null;
  decision: DecisionRecord | null;
};

type ChildPayload = {
  fullName: string;
  age: number;
  grade: number;
  schoolId?: string | null;
  notes?: string | null;
};

type ProgramPayload = {
  title: string;
  subjectArea: string;
  shortDescription: string;
  fullDescription: string;
  ageMin?: number | null;
  ageMax?: number | null;
  gradeMin?: number | null;
  gradeMax?: number | null;
  modules: string[];
  learningOutcomes: string[];
  evaluationMethod: string;
  reportFormatSummary?: string | null;
  isPublished: boolean;
};

type QueryValue = string | number | boolean | null | undefined;

function buildQueryString(params: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

// --- Dashboard & Profile ---

export async function fetchMe() {
  return apiFetch<DashboardMe>("/api/me");
}

export async function updateMyProfile(input: {
  displayName: string;
  city?: string | null;
  subjects?: string[];
}) {
  return apiFetch<{ account: DashboardMe["account"] }>("/api/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

// --- Catalog ---

export async function fetchSchools(filters: {
  city?: string;
  search?: string;
} = {}) {
  const query = buildQueryString(filters);

  return apiFetch<{ schools: SchoolCatalogItem[] }>(`/api/catalog/schools${query}`);
}

export async function fetchCatalogPrograms(filters: {
  city?: string;
  subject?: string;
  age?: number;
  grade?: number;
  clubId?: string;
  search?: string;
} = {}) {
  const query = buildQueryString(filters);

  return apiFetch<{ programs: ProgramRecord[] }>(`/api/catalog/programs${query}`);
}

// --- Children ---

export async function fetchChildren() {
  return apiFetch<{ children: ChildRecord[] }>("/api/children");
}

export async function createChild(input: ChildPayload) {
  return apiFetch<{ child: ChildRecord }>("/api/children", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function updateChild(id: string, input: ChildPayload) {
  return apiFetch<{ child: ChildRecord }>(`/api/children/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function deleteChild(id: string) {
  return apiFetch<{ ok: true }>(`/api/children/${id}`, {
    method: "DELETE",
  });
}

// --- Recognition Requests ---

export async function fetchParentRequests() {
  return apiFetch<{ requests: RecognitionRequestRecord[] }>("/api/requests");
}

export async function fetchParentRequest(id: string) {
  return apiFetch<{ request: RecognitionRequestRecord }>(`/api/requests/${id}`);
}

export async function createRecognitionRequest(input: {
  childId: string;
  schoolId: string;
  clubProgramId: string;
  targetSubject: string;
  targetGrade: number;
  recognitionScope: "FULL" | "PARTIAL";
  parentNote?: string | null;
}) {
  return apiFetch<{ request: RecognitionRequestRecord }>("/api/requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

// --- Club Programs ---

export async function fetchPrograms() {
  return apiFetch<{ programs: ProgramRecord[] }>("/api/programs");
}

export async function createProgram(input: ProgramPayload) {
  return apiFetch<{ program: ProgramRecord }>("/api/programs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function updateProgram(id: string, input: ProgramPayload) {
  return apiFetch<{ program: ProgramRecord }>(`/api/programs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function fetchProgram(id: string) {
  return apiFetch<{ program: ProgramRecord; requests: ClubRequestRecord[] }>(
    `/api/programs/${id}`,
  );
}

export async function fetchClubRequests() {
  return apiFetch<{ requests: ClubRequestRecord[] }>("/api/club/requests");
}

export async function fetchClubRequest(id: string) {
  return apiFetch<{ request: ClubRequestRecord }>(`/api/club/requests/${id}`);
}

export async function runProgramAiPreview(
  id: string,
  input: {
    targetSubject: string;
    targetGrade: number;
    recognitionScope: "FULL" | "PARTIAL";
  },
) {
  return apiFetch<{ analysis: AiAnalysisRecord }>(`/api/programs/${id}/ai-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function submitClubEvidence(
  id: string,
  input: {
    clubEvidenceSummary: string;
    attendanceRate?: number | null;
    externalPerformanceBand?: string | null;
  },
) {
  return apiFetch<{ request: ClubRequestRecord }>(`/api/requests/${id}/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

// --- School Review ---

export async function fetchSchoolRequests(filters: {
  status?: RecognitionRequestRecord["status"];
} = {}) {
  const query = buildQueryString(filters);

  return apiFetch<{ requests: RecognitionRequestRecord[] }>(
    `/api/school/requests${query}`,
  );
}

export async function fetchSchoolRequest(id: string) {
  return apiFetch<{ request: RecognitionRequestRecord }>(
    `/api/school/requests/${id}`,
  );
}

export async function markRequestUnderReview(id: string) {
  return apiFetch<{ request: RecognitionRequestRecord }>(
    `/api/school/requests/${id}/mark-under-review`,
    { method: "POST" },
  );
}

export async function submitSchoolDecision(
  id: string,
  input: {
    decision: DecisionRecord["decision"];
    comment: string;
    recognizedTopics?: string[];
  },
) {
  return apiFetch<{ request: RecognitionRequestRecord }>(
    `/api/school/requests/${id}/decision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
}

export async function createQuickProgram(input: {
  title: string;
  subjectArea: string;
  audience?: string | null;
}) {
  return apiFetch<{ program: ProgramRecord }>("/api/programs/quick", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function uploadProgramFile(programId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<{ program: ProgramRecord }>(
    `/api/programs/${programId}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function deleteProgram(id: string) {
  return apiFetch<{ ok: true }>(`/api/programs/${id}`, {
    method: "DELETE",
  });
}

// --- School Model Plans ---

export type SchoolModelPlan = {
  id: string;
  schoolId: string;
  subjectArea: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramComparisonReport = {
  verdict: "FULLY_SUITABLE" | "PARTIALLY_SUITABLE" | "REJECT";
  coveragePercent: number;
  justification: string;
  modelPlanRequirements: string[];
  alignmentDetails: Array<{
    requirement: string;
    match: string;
    status: "Full" | "Partial" | "Missing" | "Contradictory";
    comment: string;
  }>;
  violations: string[];
  recommendations: string[];
};

// --- Program Review ---

export type ProgramReviewRecord = {
  id: string;
  clubId: string;
  clubProgramId: string;
  schoolId: string;
  status: "PENDING" | "APPROVED" | "RETURNED" | "REJECTED";
  schoolComment: string | null;
  createdAt: string;
  updatedAt: string;
  club: { id: string; name: string; city: string | null };
  clubProgram: {
    id: string;
    title: string;
    subjectArea: string;
    audience: string | null;
    programFileUrl: string | null;
  };
  school: { id: string; name: string; city: string | null };
  aiVerdict: string | null;
  aiCoveragePercent: number | null;
  aiReportJson: ProgramComparisonReport | null;
};

export async function createProgramReview(input: {
  clubProgramId: string;
  schoolId: string;
}) {
  return apiFetch<{ review: ProgramReviewRecord }>("/api/program-reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function fetchProgramReviews() {
  return apiFetch<{ reviews: ProgramReviewRecord[] }>("/api/program-reviews");
}

export async function fetchSchoolProgramReviews() {
  return apiFetch<{ reviews: ProgramReviewRecord[] }>("/api/school/program-reviews");
}

export async function submitProgramReviewDecision(
  id: string,
  input: { decision: "APPROVE" | "REJECT" | "RETURN"; comment?: string | null },
) {
  return apiFetch<{ review: ProgramReviewRecord }>(
    `/api/school/program-reviews/${id}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

// --- Enrollment ---

export type EnrollmentRecord = {
  id: string;
  childId: string;
  parentProfileId: string;
  clubId: string;
  clubProgramId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  createdAt: string;
  updatedAt: string;
  child: { id: string; fullName: string; age: number; grade: number };
  parent: { displayName: string; email: string };
  club: { id: string; name: string };
  clubProgram: { id: string; title: string; subjectArea: string };
};

export async function createEnrollment(input: {
  childId: string;
  clubProgramId: string;
  note?: string | null;
}) {
  return apiFetch<{ enrollment: EnrollmentRecord }>("/api/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function fetchParentEnrollments() {
  return apiFetch<{ enrollments: EnrollmentRecord[] }>("/api/enrollments");
}

export async function fetchClubEnrollments() {
  return apiFetch<{ enrollments: EnrollmentRecord[] }>("/api/club/enrollments");
}

export async function submitEnrollmentDecision(
  id: string,
  input: { decision: "APPROVE" | "REJECT" },
) {
  return apiFetch<{ enrollment: EnrollmentRecord }>(
    `/api/club/enrollments/${id}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

// --- Journal ---

export type JournalEntryRecord = {
  id: string;
  enrollmentRequestId: string;
  subject: string;
  scoreValue: number;
  scoreMax: number;
  comment: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type JournalResponse = {
  enrollment: {
    id: string;
    child: { id: string; fullName: string; grade: number };
    clubProgram: { id: string; title: string; subjectArea: string };
  };
  entries: JournalEntryRecord[];
};

export async function fetchJournal(enrollmentId: string) {
  return apiFetch<JournalResponse>(`/api/club/enrollments/${enrollmentId}/journal`);
}

export async function createJournalEntry(
  enrollmentId: string,
  input: {
    subject: string;
    scoreValue: number;
    scoreMax: number;
    comment?: string | null;
    date?: string | null;
  },
) {
  return apiFetch<{ entry: JournalEntryRecord }>(
    `/api/club/enrollments/${enrollmentId}/journal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function updateJournalEntry(
  entryId: string,
  input: {
    subject: string;
    scoreValue: number;
    scoreMax: number;
    comment?: string | null;
    date?: string | null;
  },
) {
  return apiFetch<{ entry: JournalEntryRecord }>(
    `/api/club/journal/${entryId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function deleteJournalEntry(entryId: string) {
  return apiFetch<{ ok: true }>(`/api/club/journal/${entryId}`, {
    method: "DELETE",
  });
}

// --- School Model Plans API ---

export async function fetchSchoolModelPlans() {
  return apiFetch<{ plans: SchoolModelPlan[] }>("/api/school/model-plans");
}

export async function uploadSchoolModelPlan(input: {
  title: string;
  subjectArea: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("subjectArea", input.subjectArea);
  formData.append("file", input.file);

  return apiFetch<{ plan: SchoolModelPlan }>("/api/school/model-plans", {
    method: "POST",
    body: formData,
  });
}

export async function deleteSchoolModelPlan(id: string) {
  return apiFetch<{ ok: true }>(`/api/school/model-plans/${id}`, {
    method: "DELETE",
  });
}
