/**
 * AI-powered comparison of club programs against school government-approved model plans.
 * Uses OpenAI to analyze alignment and generate coverage reports.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { env } from "./env.js";

const DEFAULT_MODEL = "gpt-4.1-mini";

export type ProgramComparisonInput = {
  clubProgramTitle: string;
  clubProgramSubject: string;
  clubProgramFileUrl: string | null;
  clubProgramDescription: string;
  clubProgramModules: string[];
  clubProgramOutcomes: string[];
  clubProgramEvaluation: string;
  modelPlanTitle: string;
  modelPlanFileUrl: string;
};

export type ProgramComparisonResult = {
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

const comparisonResultSchema = z.object({
  verdict: z.enum(["FULLY_SUITABLE", "PARTIALLY_SUITABLE", "REJECT"]),
  coveragePercent: z.number().int().min(0).max(100),
  justification: z.string().min(10),
  modelPlanRequirements: z.array(z.string()).max(20),
  alignmentDetails: z
    .array(
      z.object({
        requirement: z.string(),
        match: z.string(),
        status: z.enum(["Full", "Partial", "Missing", "Contradictory"]),
        comment: z.string(),
      }),
    )
    .max(20),
  violations: z.array(z.string()).max(10),
  recommendations: z.array(z.string()).max(10),
});

const COMPARISON_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "verdict",
    "coveragePercent",
    "justification",
    "modelPlanRequirements",
    "alignmentDetails",
    "violations",
    "recommendations",
  ],
  properties: {
    verdict: { type: "string", enum: ["FULLY_SUITABLE", "PARTIALLY_SUITABLE", "REJECT"] },
    coveragePercent: { type: "integer", minimum: 0, maximum: 100 },
    justification: { type: "string", minLength: 10 },
    modelPlanRequirements: { type: "array", items: { type: "string" }, maxItems: 20 },
    alignmentDetails: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "match", "status", "comment"],
        properties: {
          requirement: { type: "string" },
          match: { type: "string" },
          status: { type: "string", enum: ["Full", "Partial", "Missing", "Contradictory"] },
          comment: { type: "string" },
        },
      },
    },
    violations: { type: "array", items: { type: "string" }, maxItems: 10 },
    recommendations: { type: "array", items: { type: "string" }, maxItems: 10 },
  },
} as const;

async function readLocalFile(fileUrl: string): Promise<string> {
  try {
    const filePath = join(process.cwd(), fileUrl);
    const buffer = await readFile(filePath);
    return buffer.toString("base64");
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `You are an expert academic program auditor and curriculum alignment reviewer.

Your task is to analyze and compare two documents:
1. Model Plan — the government-approved reference document defining structure, competencies, modules, and expected outcomes.
2. Education Plan — the club's proposed program that must be checked against the Model Plan.

Analyze by meaning and logical equivalence, not only exact wording.

Decision rule:
- Less than 30-40% logically connected alignment → REJECT
- Meaningful but incomplete alignment → PARTIALLY_SUITABLE
- Substantially and coherently implements the Model Plan → FULLY_SUITABLE

Be strict and evidence-based. Do not assume compliance where evidence is weak.
All text output must be in Ukrainian.`;

export async function compareProgramWithModelPlan(
  input: ProgramComparisonInput,
): Promise<ProgramComparisonResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return createFallbackResult(input);
  }

  const modelName = env.OPENAI_MODEL || DEFAULT_MODEL;

  const clubContent = [
    `Назва програми гуртка: ${input.clubProgramTitle}`,
    `Предмет: ${input.clubProgramSubject}`,
    `Опис: ${input.clubProgramDescription}`,
    input.clubProgramModules.length > 0
      ? `Модулі: ${input.clubProgramModules.join("; ")}`
      : "",
    input.clubProgramOutcomes.length > 0
      ? `Очікувані результати: ${input.clubProgramOutcomes.join("; ")}`
      : "",
    `Оцінювання: ${input.clubProgramEvaluation}`,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `Проаналізуй два документи:

## Програма гуртка (Education Plan):
${clubContent}

## Модельна програма (Model Plan):
Назва: ${input.modelPlanTitle}
Предмет: ${input.clubProgramSubject}

Порівняй програму гуртка з модельною програмою за змістом, структурою та логічним зв'язком.
Визнач відсоток покриття модельної програми, вердикт та детальний аналіз.
Дай рекомендації щодо можливих оцінок конвертації на основі глибини програми гуртка відносно державної програми.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "program_comparison",
            schema: COMPARISON_RESPONSE_SCHEMA,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return createFallbackResult(input);
    }

    const data = await response.json();
    const outputText = data?.output?.[0]?.content?.[0]?.text;

    if (!outputText) {
      return createFallbackResult(input);
    }

    const parsed = comparisonResultSchema.safeParse(JSON.parse(outputText));

    if (!parsed.success) {
      console.error("Failed to parse AI response:", parsed.error);
      return createFallbackResult(input);
    }

    return parsed.data;
  } catch (error) {
    console.error("Program comparison error:", error);
    return createFallbackResult(input);
  }
}

function createFallbackResult(
  input: ProgramComparisonInput,
): ProgramComparisonResult {
  const hasModules = input.clubProgramModules.length > 0;
  const hasOutcomes = input.clubProgramOutcomes.length > 0;
  const hasEvaluation = input.clubProgramEvaluation.length > 10;

  let score = 20;
  if (hasModules) score += 25;
  if (hasOutcomes) score += 25;
  if (hasEvaluation) score += 15;
  if (input.clubProgramDescription.length > 100) score += 15;

  const verdict =
    score >= 70
      ? "PARTIALLY_SUITABLE"
      : score >= 40
        ? "PARTIALLY_SUITABLE"
        : "REJECT";

  return {
    verdict,
    coveragePercent: Math.min(score, 100),
    justification:
      "Автоматична оцінка на основі структурного аналізу програми (без AI). Для точнішого результату потрібен ключ OpenAI API.",
    modelPlanRequirements: [
      "Структурована програма з модулями",
      "Визначені очікувані результати навчання",
      "Описана система оцінювання",
    ],
    alignmentDetails: [
      {
        requirement: "Модулі та тематичний план",
        match: hasModules ? `${input.clubProgramModules.length} модулів визначено` : "Не вказано",
        status: hasModules ? "Partial" : "Missing",
        comment: hasModules
          ? "Модулі присутні, але без порівняння з модельною програмою."
          : "Модулі не визначені у програмі гуртка.",
      },
      {
        requirement: "Очікувані результати навчання",
        match: hasOutcomes ? `${input.clubProgramOutcomes.length} результатів` : "Не вказано",
        status: hasOutcomes ? "Partial" : "Missing",
        comment: hasOutcomes
          ? "Результати заявлені, але потрібна ручна перевірка відповідності."
          : "Очікувані результати навчання відсутні.",
      },
      {
        requirement: "Система оцінювання",
        match: hasEvaluation ? "Описана" : "Не вказано",
        status: hasEvaluation ? "Partial" : "Missing",
        comment: hasEvaluation
          ? "Оцінювання описане, відповідність перевіряється вручну."
          : "Система оцінювання не описана.",
      },
    ],
    violations: hasModules && hasOutcomes
      ? ["Детальне порівняння з модельною програмою потребує AI-аналізу."]
      : [
          "Програма гуртка містить недостатньо структурованих даних для повноцінного порівняння.",
          "Рекомендується додати модулі, очікувані результати та опис оцінювання.",
        ],
    recommendations: [
      "Додайте повний опис модулів програми для точнішого порівняння.",
      "Вкажіть очікувані результати навчання відповідно до державного стандарту.",
      "Опишіть систему оцінювання та конвертації оцінок.",
    ],
  };
}
