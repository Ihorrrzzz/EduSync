/**
 * AI-powered and heuristic-fallback recommendation scoring for curriculum compatibility.
 * Calls OpenAI for analysis with a 15s timeout, falls back to keyword-matching heuristic.
 */
import { RecognitionScope } from "@prisma/client";
import { z } from "zod";
import { env } from "./env.js";

type SubjectGroup = {
  label: string;
  keywords: string[];
  evidence: string;
};

export type RecommendationBandInput = {
  programTitle: string;
  subjectArea?: string | null;
  shortDescription?: string | null;
  fullDescription: string;
  modules: string[];
  learningOutcomes: string[];
  evaluationMethod: string;
  reportFormatSummary?: string | null;
  clubEvidenceSummary?: string | null;
  targetSubject: string;
  targetGrade: number;
  recognitionScope: RecognitionScope;
  ageMin?: number | null;
  ageMax?: number | null;
  gradeMin?: number | null;
  gradeMax?: number | null;
};

export type RecommendationBandResult = {
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
  rawResponse: unknown;
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const SAFE_BAND_EXPLANATION =
  "AI-аналіз у EduSync має дорадчий характер. Остаточне рішення щодо зарахування або часткового визнання завжди ухвалює школа після ручної перевірки програми та доказів від гуртка.";

const OPENAI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "compatibilityScore",
    "recommendationBand",
    "recommendedSchoolAction",
    "confidence",
    "summary",
    "matchedOutcomes",
    "gaps",
    "suggestedEvidence",
    "safeBandExplanation",
  ],
  properties: {
    compatibilityScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    recommendationBand: {
      type: "string",
      enum: ["strong", "possible", "weak"],
    },
    recommendedSchoolAction: {
      type: "string",
      enum: ["full_candidate", "partial_candidate", "manual_review"],
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
    summary: {
      type: "string",
      minLength: 12,
    },
    matchedOutcomes: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    suggestedEvidence: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    safeBandExplanation: {
      type: "string",
      minLength: 12,
    },
  },
} as const;

const recommendationBandResultSchema = z.object({
  compatibilityScore: z.number().int().min(0).max(100),
  recommendationBand: z.enum(["strong", "possible", "weak"]),
  recommendedSchoolAction: z.enum([
    "full_candidate",
    "partial_candidate",
    "manual_review",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  summary: z.string().min(12),
  matchedOutcomes: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  suggestedEvidence: z.array(z.string()).max(5),
  safeBandExplanation: z.string().min(12),
});

const SUBJECT_GROUPS: Record<string, SubjectGroup[]> = {
  "англійська мова": [
    {
      label: "усне мовлення та взаємодія",
      keywords: ["speaking", "conversation", "dialogue", "усн", "мовлен", "комунікац"],
      evidence: "Приклади усних завдань або короткий опис практики говоріння.",
    },
    {
      label: "читання та розуміння тексту",
      keywords: ["reading", "text", "читан", "comprehension", "story"],
      evidence: "Фрагменти плану занять або звіту з читання та аналізу текстів.",
    },
    {
      label: "письмо",
      keywords: ["writing", "essay", "email", "письм", "grammar task"],
      evidence: "Зразки письмових робіт або опис письмових перевірок.",
    },
    {
      label: "лексика та граматика",
      keywords: ["grammar", "vocabulary", "tense", "лексик", "грамат"],
      evidence: "Короткий опис тем з граматики та лексики за курсом.",
    },
  ],
  "мистецтво": [
    {
      label: "виконавська або творча практика",
      keywords: ["performance", "drawing", "painting", "виконан", "творч", "вокал", "фортепіано"],
      evidence: "Підсумковий опис творчих робіт або виступів учня.",
    },
    {
      label: "основи мови мистецтва",
      keywords: ["rhythm", "theory", "color", "компози", "ритм", "теор"],
      evidence: "Короткий опис модулів з теорії або композиції.",
    },
    {
      label: "аналіз та рефлексія",
      keywords: ["analysis", "reflection", "слухан", "аналіз", "обговор"],
      evidence: "Форма оцінювання, де видно аналіз або самооцінювання.",
    },
  ],
  "інформатика": [
    {
      label: "алгоритмічне мислення",
      keywords: ["algorithm", "logic", "sequence", "алгоритм", "логік"],
      evidence: "Приклади задач або опис проєктів з алгоритмічним мисленням.",
    },
    {
      label: "програмування та створення рішень",
      keywords: ["coding", "programming", "python", "scratch", "код", "програм"],
      evidence: "Приклади коду, середовищ або опис фінальних проєктів.",
    },
    {
      label: "робота з цифровими інструментами",
      keywords: ["data", "digital", "robot", "sensor", "цифр", "робот"],
      evidence: "Опис використаних платформ, робототехніки або цифрових інструментів.",
    },
    {
      label: "проєктна робота",
      keywords: ["project", "team", "prototype", "проєкт", "команд"],
      evidence: "Портфоліо або опис проєктної діяльності учня.",
    },
  ],
  "технології": [
    {
      label: "проєктування та дизайн",
      keywords: ["design", "prototype", "concept", "дизайн", "проєктув"],
      evidence: "Матеріали або звіт з проєктування та створення виробу.",
    },
    {
      label: "матеріали та інструменти",
      keywords: ["tool", "material", "maker", "інструмент", "матеріал"],
      evidence: "Опис використаних інструментів, матеріалів і техніки безпеки.",
    },
    {
      label: "виготовлення та презентація результату",
      keywords: ["build", "fabrication", "presentation", "виготов", "презентац"],
      evidence: "Фото, опис або критерії оцінювання готового виробу.",
    },
  ],
  "фізична культура": [
    {
      label: "рухові навички та техніка",
      keywords: ["swimming", "technique", "coordination", "технік", "координац"],
      evidence: "Короткий звіт тренера про техніку та поступ дитини.",
    },
    {
      label: "витривалість і фізичний розвиток",
      keywords: ["fitness", "endurance", "strength", "витривал", "фізичн"],
      evidence: "Опис навантаження, регулярності занять або контрольних нормативів.",
    },
    {
      label: "дисципліна та безпечна участь",
      keywords: ["safety", "team", "attendance", "безпек", "дисципл"],
      evidence: "Підтвердження відвідуваності та дотримання безпечних практик.",
    },
  ],
  "математика": [
    {
      label: "числа та обчислення",
      keywords: ["equation", "number", "fraction", "числ", "обчисл"],
      evidence: "Приклади задач або модулів із регулярним розв'язуванням вправ.",
    },
    {
      label: "логіка та доведення",
      keywords: ["logic", "proof", "pattern", "логік", "довед"],
      evidence: "Опис логічних задач або форм оцінювання мислення.",
    },
    {
      label: "застосування в задачах і проєктах",
      keywords: ["problem", "model", "project", "задач", "моделюв"],
      evidence: "Завдання прикладного характеру або мініпроєкти з математики.",
    },
  ],
  "природничі науки": [
    {
      label: "спостереження та пояснення явищ",
      keywords: ["experiment", "observation", "nature", "дослід", "спостереж"],
      evidence: "Опис дослідів або звітів зі спостережень.",
    },
    {
      label: "науковий метод і висновки",
      keywords: ["hypothesis", "analysis", "conclusion", "гіпотез", "виснов"],
      evidence: "Плани досліджень або форми підсумкових висновків.",
    },
    {
      label: "практичне застосування знань",
      keywords: ["project", "lab", "ecology", "лаборатор", "еколог"],
      evidence: "Проєктні роботи або лабораторні завдання з результатами.",
    },
  ],
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function uniqStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function resolveSubjectGroups(targetSubject: string) {
  const normalizedSubject = normalizeText(targetSubject);
  const directMatch = SUBJECT_GROUPS[normalizedSubject];

  if (directMatch) {
    return directMatch;
  }

  const fallbackEntry = Object.entries(SUBJECT_GROUPS).find(([subjectKey]) =>
    normalizedSubject.includes(subjectKey),
  );

  if (fallbackEntry) {
    return fallbackEntry[1];
  }

  return [
    {
      label: `ключові результати з предмета «${targetSubject}»`,
      keywords: normalizedSubject.split(/\s+/).filter((token) => token.length > 2),
      evidence: "Навчальний план гуртка та підсумковий звіт з темами та результатами.",
    },
  ];
}

function hasKeywordMatch(text: string, keyword: string) {
  return text.includes(keyword.toLowerCase());
}

function pickMatchingLines(lines: string[], groups: SubjectGroup[]) {
  const matchedLines = lines.filter((line) => {
    const normalizedLine = normalizeText(line);

    return groups.some((group) =>
      group.keywords.some((keyword) => hasKeywordMatch(normalizedLine, keyword)),
    );
  });

  return uniqStrings(matchedLines).slice(0, 5);
}

function buildSummary(
  band: RecommendationBandResult["recommendationBand"],
  targetSubject: string,
  targetGrade: number,
  matchedGroups: string[],
  gaps: string[],
) {
  const intro =
    band === "strong"
      ? "Програма має сильну сумісність"
      : band === "possible"
        ? "Програма має помірну сумісність"
        : "Програма має обмежену сумісність";
  const matchedPart =
    matchedGroups.length > 0
      ? ` Найкраще покрито: ${matchedGroups.slice(0, 3).join(", ")}.`
      : "";
  const gapsPart =
    gaps.length > 0 ? ` Потребують ручної перевірки: ${gaps.slice(0, 2).join(", ")}.` : "";

  return `${intro} з предметом «${targetSubject}» для ${targetGrade} класу.${matchedPart}${gapsPart}`;
}

function buildHeuristicRecommendation(
  input: RecommendationBandInput,
): RecommendationBandResult {
  const subjectGroups = resolveSubjectGroups(input.targetSubject);
  const allProgramLines = uniqStrings([
    input.programTitle,
    input.subjectArea ?? "",
    input.shortDescription ?? "",
    input.fullDescription,
    input.evaluationMethod,
    input.reportFormatSummary ?? "",
    input.clubEvidenceSummary ?? "",
    ...input.modules,
    ...input.learningOutcomes,
  ]);
  const fullProgramText = normalizeText(allProgramLines.join(" "));
  const matchedGroups = subjectGroups.filter((group) =>
    group.keywords.some((keyword) => hasKeywordMatch(fullProgramText, keyword)),
  );
  const groupCoverageRatio =
    subjectGroups.length > 0 ? matchedGroups.length / subjectGroups.length : 0;
  const matchedOutcomeLines = pickMatchingLines(input.learningOutcomes, matchedGroups);
  const matchedModuleLines = pickMatchingLines(input.modules, matchedGroups);
  const outcomeMatchRatio =
    input.learningOutcomes.length > 0
      ? matchedOutcomeLines.length / input.learningOutcomes.length
      : 0;
  const moduleMatchRatio =
    input.modules.length > 0 ? matchedModuleLines.length / input.modules.length : 0;
  const evaluationSignal = /(оцін|assessment|rubric|portfolio|test|exam|presentation|звіт)/i.test(
    input.evaluationMethod,
  )
    ? 1
    : 0.35;
  const reportSignal =
    input.reportFormatSummary || input.clubEvidenceSummary ? 1 : 0.3;
  const subjectAreaSignal = hasKeywordMatch(
    normalizeText(`${input.programTitle} ${input.subjectArea ?? ""}`),
    normalizeText(input.targetSubject).split(/\s+/)[0] ?? "",
  )
    ? 1
    : matchedGroups.length > 0
      ? 0.7
      : 0.25;
  let gradeFit = 0.65;

  if (typeof input.gradeMin === "number" && typeof input.gradeMax === "number") {
    if (input.targetGrade >= input.gradeMin && input.targetGrade <= input.gradeMax) {
      gradeFit = 1;
    } else {
      const distance = Math.min(
        Math.abs(input.targetGrade - input.gradeMin),
        Math.abs(input.targetGrade - input.gradeMax),
      );
      gradeFit = distance <= 1 ? 0.45 : 0.15;
    }
  }

  const completenessSignals = [
    input.shortDescription,
    input.fullDescription,
    input.modules.length > 0 ? "modules" : "",
    input.learningOutcomes.length > 0 ? "outcomes" : "",
    input.evaluationMethod,
    input.reportFormatSummary,
  ].filter(Boolean).length;
  const completenessRatio = completenessSignals / 6;
  const scopeModifier = input.recognitionScope === RecognitionScope.FULL ? -6 : 2;
  const rawScore =
    24 +
    groupCoverageRatio * 31 +
    outcomeMatchRatio * 13 +
    moduleMatchRatio * 12 +
    evaluationSignal * 7 +
    reportSignal * 4 +
    subjectAreaSignal * 7 +
    gradeFit * 7 +
    completenessRatio * 5 +
    scopeModifier;
  const compatibilityScore = Math.max(12, Math.min(94, Math.round(rawScore)));
  const recommendationBand: RecommendationBandResult["recommendationBand"] =
    compatibilityScore >= 78 && groupCoverageRatio >= 0.55
      ? "strong"
      : compatibilityScore >= 52 && groupCoverageRatio >= 0.3
        ? "possible"
        : "weak";
  const recommendedSchoolAction: RecommendationBandResult["recommendedSchoolAction"] =
    recommendationBand === "strong" &&
    compatibilityScore >= 84 &&
    input.recognitionScope === RecognitionScope.FULL
      ? "full_candidate"
      : compatibilityScore >= 58
        ? "partial_candidate"
        : "manual_review";
  const confidence: RecommendationBandResult["confidence"] =
    completenessRatio >= 0.8 && matchedGroups.length >= 2
      ? "high"
      : completenessRatio >= 0.5
        ? "medium"
        : "low";
  const matchedOutcomeFallback = uniqStrings([
    ...matchedOutcomeLines,
    ...matchedModuleLines,
    ...matchedGroups.map((group) => `Покрито напрям: ${group.label}`),
  ]).slice(0, 5);
  const gaps = subjectGroups
    .filter(
      (group) => !matchedGroups.some((matchedGroup) => matchedGroup.label === group.label),
    )
    .map((group) => `Потрібно окремо підтвердити: ${group.label}`)
    .slice(0, 5);
  const suggestedEvidence = uniqStrings([
    ...subjectGroups
      .filter(
        (group) => !matchedGroups.some((matchedGroup) => matchedGroup.label === group.label),
      )
      .map((group) => group.evidence),
    input.reportFormatSummary
      ? ""
      : "Додати короткий опис формату підсумкового звіту від гуртка.",
    input.clubEvidenceSummary
      ? ""
      : "Підготувати стислий пакет доказів від гуртка для школи.",
    input.evaluationMethod.match(/оцін|assessment|rubric|portfolio|test|exam/i)
      ? ""
      : "Описати критерії оцінювання або формат підсумкової перевірки.",
    "За потреби школа може запросити додаткові приклади робіт або відомість відвідуваності.",
  ]).slice(0, 5);

  return {
    provider: "heuristic",
    modelName: "heuristic-v1",
    compatibilityScore,
    recommendationBand,
    recommendedSchoolAction,
    confidence,
    summary: buildSummary(
      recommendationBand,
      input.targetSubject,
      input.targetGrade,
      matchedGroups.map((group) => group.label),
      gaps,
    ),
    matchedOutcomes: matchedOutcomeFallback,
    gaps,
    suggestedEvidence,
    safeBandExplanation: SAFE_BAND_EXPLANATION,
    rawResponse: {
      strategy: "heuristic",
      matchedGroupLabels: matchedGroups.map((group) => group.label),
      coverageRatio: groupCoverageRatio,
    },
  };
}

function extractOpenAiOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typedPayload = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof typedPayload.output_text === "string" && typedPayload.output_text.trim()) {
    return typedPayload.output_text;
  }

  const textFragments =
    typedPayload.output
      ?.flatMap((item) => item.content ?? [])
      .map((contentItem) => contentItem.text)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0) ??
    [];

  return textFragments.length > 0 ? textFragments.join("\n") : null;
}

async function requestOpenAiRecommendation(
  input: RecommendationBandInput,
): Promise<RecommendationBandResult | null> {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL ?? DEFAULT_MODEL,
        temperature: 0.2,
        input: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text:
                  "Ти формуєш лише дорадчий AI recommendation band для школи. Пиши українською. Не стверджуй юридичну обов'язковість, не обіцяй автоматичне зарахування або точне переведення оцінок. Якщо даних мало, будь консервативним. Поверни лише JSON за заданою схемою.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: JSON.stringify(input),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "recommendation_band",
            strict: true,
            schema: OPENAI_RESPONSE_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    const outputText = extractOpenAiOutputText(payload);

    if (!outputText) {
      return null;
    }

    const parsed = recommendationBandResultSchema.parse(JSON.parse(outputText));

    return {
      provider: "openai",
      modelName: env.OPENAI_MODEL ?? DEFAULT_MODEL,
      compatibilityScore: parsed.compatibilityScore,
      recommendationBand: parsed.recommendationBand,
      recommendedSchoolAction: parsed.recommendedSchoolAction,
      confidence: parsed.confidence,
      summary: parsed.summary,
      matchedOutcomes: uniqStrings(parsed.matchedOutcomes).slice(0, 5),
      gaps: uniqStrings(parsed.gaps).slice(0, 5),
      suggestedEvidence: uniqStrings(parsed.suggestedEvidence).slice(0, 5),
      safeBandExplanation:
        parsed.safeBandExplanation.trim() || SAFE_BAND_EXPLANATION,
      rawResponse: payload,
    };
  } catch (error) {
    console.error("[AI] OpenAI recommendation request failed:", error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateRecommendationBand(
  input: RecommendationBandInput,
): Promise<RecommendationBandResult> {
  const openAiResult = await requestOpenAiRecommendation(input);

  if (openAiResult) {
    return openAiResult;
  }

  return buildHeuristicRecommendation(input);
}

export function generateHeuristicRecommendationBand(input: RecommendationBandInput) {
  return buildHeuristicRecommendation(input);
}
