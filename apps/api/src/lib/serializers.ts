import type { Prisma } from "@prisma/client";

type ChildWithSchool = Prisma.ChildGetPayload<{
  include: { school: true };
}>;

type ProgramWithClub = Prisma.ClubProgramGetPayload<{
  include: { club: true };
}>;

type RequestWithRelations = Prisma.RecognitionRequestGetPayload<{
  include: {
    child: {
      include: {
        school: true;
      };
    };
    school: true;
    club: true;
    clubProgram: {
      include: {
        club: true;
      };
    };
    aiAnalysis: true;
    decision: true;
  };
}>;

type ClubRequestWithRelations = Prisma.RecognitionRequestGetPayload<{
  include: {
    child: {
      include: {
        school: true;
      };
    };
    school: true;
    clubProgram: true;
    aiAnalysis: true;
    decision: true;
    parentProfile: {
      include: {
        profile: true;
      };
    };
  };
}>;

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function serializeChild(child: ChildWithSchool) {
  return {
    id: child.id,
    fullName: child.fullName,
    age: child.age,
    grade: child.grade,
    schoolId: child.schoolId,
    schoolNameSnapshot: child.schoolNameSnapshot,
    notes: child.notes,
    createdAt: child.createdAt,
    updatedAt: child.updatedAt,
    school: child.school
      ? {
          id: child.school.id,
          name: child.school.name,
          city: child.school.city,
        }
      : null,
  };
}

export function serializeProgram(program: ProgramWithClub) {
  return {
    id: program.id,
    clubId: program.clubId,
    title: program.title,
    subjectArea: program.subjectArea,
    shortDescription: program.shortDescription,
    fullDescription: program.fullDescription,
    ageMin: program.ageMin,
    ageMax: program.ageMax,
    gradeMin: program.gradeMin,
    gradeMax: program.gradeMax,
    modules: asStringArray(program.modules),
    learningOutcomes: asStringArray(program.learningOutcomes),
    evaluationMethod: program.evaluationMethod,
    reportFormatSummary: program.reportFormatSummary,
    isPublished: program.isPublished,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    club: {
      id: program.club.id,
      name: program.club.name,
      city: program.club.city,
      subjects: program.club.subjects,
    },
  };
}

export function serializeAiAnalysis(
  analysis: RequestWithRelations["aiAnalysis"] | ClubRequestWithRelations["aiAnalysis"],
) {
  if (!analysis) {
    return null;
  }

  return {
    id: analysis.id,
    provider: analysis.provider,
    modelName: analysis.modelName,
    compatibilityScore: analysis.compatibilityScore,
    recommendationBand: analysis.recommendationBand,
    recommendedSchoolAction: analysis.recommendedSchoolAction,
    confidence: analysis.confidence,
    summary: analysis.summary,
    matchedOutcomes: asStringArray(analysis.matchedOutcomes),
    gaps: asStringArray(analysis.gaps),
    suggestedEvidence: asStringArray(analysis.suggestedEvidence),
    safeBandExplanation: analysis.safeBandExplanation,
    createdAt: analysis.createdAt,
  };
}

export function serializeDecision(
  decision: RequestWithRelations["decision"] | ClubRequestWithRelations["decision"],
) {
  if (!decision) {
    return null;
  }

  return {
    id: decision.id,
    schoolId: decision.schoolId,
    decision: decision.decision,
    comment: decision.comment,
    recognizedTopics: asStringArray(decision.recognizedTopics),
    decidedAt: decision.decidedAt,
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt,
  };
}

export function serializeRequest(request: RequestWithRelations) {
  return {
    id: request.id,
    parentProfileId: request.parentProfileId,
    childId: request.childId,
    schoolId: request.schoolId,
    clubId: request.clubId,
    clubProgramId: request.clubProgramId,
    targetSubject: request.targetSubject,
    targetGrade: request.targetGrade,
    recognitionScope: request.recognitionScope,
    parentNote: request.parentNote,
    clubEvidenceSummary: request.clubEvidenceSummary,
    attendanceRate: request.attendanceRate,
    externalPerformanceBand: request.externalPerformanceBand,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    child: serializeChild(request.child),
    school: {
      id: request.school.id,
      name: request.school.name,
      city: request.school.city,
    },
    club: {
      id: request.club.id,
      name: request.club.name,
      city: request.club.city,
      subjects: request.club.subjects,
    },
    clubProgram: serializeProgram(request.clubProgram),
    aiAnalysis: serializeAiAnalysis(request.aiAnalysis),
    decision: serializeDecision(request.decision),
  };
}

export function serializeClubRequest(request: ClubRequestWithRelations) {
  return {
    id: request.id,
    parentProfileId: request.parentProfileId,
    childId: request.childId,
    schoolId: request.schoolId,
    clubId: request.clubId,
    clubProgramId: request.clubProgramId,
    targetSubject: request.targetSubject,
    targetGrade: request.targetGrade,
    recognitionScope: request.recognitionScope,
    parentNote: request.parentNote,
    clubEvidenceSummary: request.clubEvidenceSummary,
    attendanceRate: request.attendanceRate,
    externalPerformanceBand: request.externalPerformanceBand,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    child: serializeChild(request.child),
    school: {
      id: request.school.id,
      name: request.school.name,
      city: request.school.city,
    },
    clubProgram: {
      id: request.clubProgram.id,
      title: request.clubProgram.title,
      subjectArea: request.clubProgram.subjectArea,
      shortDescription: request.clubProgram.shortDescription,
    },
    parent: {
      displayName: request.parentProfile.displayName,
      email: request.parentProfile.profile.email,
    },
    aiAnalysis: serializeAiAnalysis(request.aiAnalysis),
    decision: serializeDecision(request.decision),
  };
}
