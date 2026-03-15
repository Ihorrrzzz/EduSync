import bcrypt from "bcrypt";
import {
  PrismaClient,
  RecognitionRequestStatus,
  RecognitionScope,
  SchoolDecision,
  UserRole,
} from "@prisma/client";
import { generateHeuristicRecommendationBand } from "../src/lib/recommendation-band.js";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo12345!";

async function upsertProfile(input: {
  email: string;
  role: UserRole;
  fullName: string;
}) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  return prisma.profile.upsert({
    where: { email: input.email },
    update: {
      role: input.role,
      fullName: input.fullName,
      passwordHash,
    },
    create: {
      email: input.email,
      role: input.role,
      fullName: input.fullName,
      passwordHash,
    },
  });
}

async function main() {
  const schoolProfileOne = await upsertProfile({
    email: "school.lyceum127@example.com",
    role: UserRole.school,
    fullName: "Ліцей №127",
  });
  const schoolProfileTwo = await upsertProfile({
    email: "school.constellation@example.com",
    role: UserRole.school,
    fullName: "Гімназія Сузір'я",
  });
  const clubProfileMusic = await upsertProfile({
    email: "club.crescendo@example.com",
    role: UserRole.club,
    fullName: "Музична школа Crescendo",
  });
  const clubProfileEnglish = await upsertProfile({
    email: "club.horizon@example.com",
    role: UserRole.club,
    fullName: "Мовний центр Horizon",
  });
  const clubProfileVector = await upsertProfile({
    email: "club.vector@example.com",
    role: UserRole.club,
    fullName: "Центр розвитку Vector",
  });
  const parentProfileOne = await upsertProfile({
    email: "parent.olena@example.com",
    role: UserRole.parent,
    fullName: "Олена Коваль",
  });
  const parentProfileTwo = await upsertProfile({
    email: "parent.andriy@example.com",
    role: UserRole.parent,
    fullName: "Андрій Мельник",
  });

  const schoolOne = await prisma.school.upsert({
    where: { profileId: schoolProfileOne.id },
    update: {
      name: "Ліцей №127",
      city: "Київ",
    },
    create: {
      profileId: schoolProfileOne.id,
      name: "Ліцей №127",
      city: "Київ",
    },
  });
  const schoolTwo = await prisma.school.upsert({
    where: { profileId: schoolProfileTwo.id },
    update: {
      name: "Гімназія Сузір'я",
      city: "Львів",
    },
    create: {
      profileId: schoolProfileTwo.id,
      name: "Гімназія Сузір'я",
      city: "Львів",
    },
  });
  const clubMusic = await prisma.club.upsert({
    where: { profileId: clubProfileMusic.id },
    update: {
      name: "Музична школа Crescendo",
      city: "Київ",
      subjects: ["Мистецтво"],
    },
    create: {
      profileId: clubProfileMusic.id,
      name: "Музична школа Crescendo",
      city: "Київ",
      subjects: ["Мистецтво"],
    },
  });
  const clubEnglish = await prisma.club.upsert({
    where: { profileId: clubProfileEnglish.id },
    update: {
      name: "Мовний центр Horizon",
      city: "Київ",
      subjects: ["Англійська мова"],
    },
    create: {
      profileId: clubProfileEnglish.id,
      name: "Мовний центр Horizon",
      city: "Київ",
      subjects: ["Англійська мова"],
    },
  });
  const clubVector = await prisma.club.upsert({
    where: { profileId: clubProfileVector.id },
    update: {
      name: "Центр розвитку Vector",
      city: "Львів",
      subjects: ["Інформатика", "Технології", "Фізична культура"],
    },
    create: {
      profileId: clubProfileVector.id,
      name: "Центр розвитку Vector",
      city: "Львів",
      subjects: ["Інформатика", "Технології", "Фізична культура"],
    },
  });
  const parentOne = await prisma.parentProfile.upsert({
    where: { profileId: parentProfileOne.id },
    update: {
      displayName: "Олена Коваль",
      city: "Київ",
    },
    create: {
      profileId: parentProfileOne.id,
      displayName: "Олена Коваль",
      city: "Київ",
    },
  });
  const parentTwo = await prisma.parentProfile.upsert({
    where: { profileId: parentProfileTwo.id },
    update: {
      displayName: "Андрій Мельник",
      city: "Львів",
    },
    create: {
      profileId: parentProfileTwo.id,
      displayName: "Андрій Мельник",
      city: "Львів",
    },
  });

  const profileIds = [
    schoolProfileOne.id,
    schoolProfileTwo.id,
    clubProfileMusic.id,
    clubProfileEnglish.id,
    clubProfileVector.id,
    parentProfileOne.id,
    parentProfileTwo.id,
  ];
  const schoolIds = [schoolOne.id, schoolTwo.id];
  const clubIds = [clubMusic.id, clubEnglish.id, clubVector.id];
  const parentIds = [parentOne.id, parentTwo.id];

  await prisma.refreshToken.deleteMany({
    where: {
      profileId: {
        in: profileIds,
      },
    },
  });
  await prisma.recognitionDecision.deleteMany({
    where: {
      schoolId: {
        in: schoolIds,
      },
    },
  });
  await prisma.recognitionAiAnalysis.deleteMany({
    where: {
      request: {
        OR: [
          { schoolId: { in: schoolIds } },
          { clubId: { in: clubIds } },
          { parentProfileId: { in: parentIds } },
        ],
      },
    },
  });
  await prisma.recognitionRequest.deleteMany({
    where: {
      OR: [
        { schoolId: { in: schoolIds } },
        { clubId: { in: clubIds } },
        { parentProfileId: { in: parentIds } },
      ],
    },
  });
  await prisma.child.deleteMany({
    where: {
      parentProfileId: {
        in: parentIds,
      },
    },
  });
  await prisma.clubProgram.deleteMany({
    where: {
      clubId: {
        in: clubIds,
      },
    },
  });

  const childMarta = await prisma.child.create({
    data: {
      parentProfileId: parentOne.id,
      fullName: "Марта Коваль",
      age: 12,
      grade: 7,
      schoolId: schoolOne.id,
      schoolNameSnapshot: schoolOne.name,
      notes: "Хоче посилити англійську та мистецькі напрями.",
    },
  });
  const childDenys = await prisma.child.create({
    data: {
      parentProfileId: parentOne.id,
      fullName: "Денис Коваль",
      age: 10,
      grade: 4,
      schoolId: schoolOne.id,
      schoolNameSnapshot: schoolOne.name,
      notes: "Цікавиться робототехнікою та STEM-проєктами.",
    },
  });
  const childSofiia = await prisma.child.create({
    data: {
      parentProfileId: parentTwo.id,
      fullName: "Софія Мельник",
      age: 13,
      grade: 8,
      schoolId: schoolTwo.id,
      schoolNameSnapshot: schoolTwo.name,
      notes: "Навчається у музичній школі другий рік.",
    },
  });

  const programPiano = await prisma.clubProgram.create({
    data: {
      clubId: clubMusic.id,
      title: "Фортепіано та музична практика",
      subjectArea: "Мистецтво",
      shortDescription:
        "Індивідуальні та малі групові заняття з фортепіано, слухання та ритму.",
      fullDescription:
        "Програма поєднує виконавську практику, сольфеджіо, ритм, аналіз музичних творів і публічні виступи. Учні працюють із невеликими п'єсами, розбирають структуру музики та ведуть коротку рефлексію після концертів.",
      ageMin: 10,
      ageMax: 16,
      gradeMin: 5,
      gradeMax: 10,
      modules: [
        "Сольфеджіо та ритм",
        "Фортепіанна техніка",
        "Підготовка концертного номеру",
      ],
      learningOutcomes: [
        "Учень виконує невеликі музичні твори перед аудиторією.",
        "Розрізняє ритмічні рисунки та динаміку.",
        "Пояснює базові елементи музичної мови.",
      ],
      evaluationMethod:
        "Щомісячне прослуховування, короткий письмовий коментар викладача та підсумковий виступ.",
      reportFormatSummary: "Щомісячний звіт викладача та підсумковий лист успіхів.",
      isPublished: true,
    },
  });
  const programChoir = await prisma.clubProgram.create({
    data: {
      clubId: clubMusic.id,
      title: "Хорова студія та сценічна практика",
      subjectArea: "Мистецтво",
      shortDescription:
        "Групові заняття з вокалу, сценічної культури та ансамблевого виконання.",
      fullDescription:
        "Учні працюють над ансамблевим звучанням, дикцією, слуханням один одного та сценічною присутністю. Програма підходить для спільних творчих проєктів та шкільних виступів.",
      ageMin: 9,
      ageMax: 15,
      gradeMin: 4,
      gradeMax: 9,
      modules: ["Вокальна розминка", "Ансамблеве виконання", "Сценічна практика"],
      learningOutcomes: [
        "Учень працює в ансамблі та утримує партію.",
        "Дотримується сценічної дисципліни.",
        "Описує художній задум твору.",
      ],
      evaluationMethod:
        "Спостереження керівника хору, аудіозаписи репетицій та виступ наприкінці модуля.",
      reportFormatSummary: "Короткий підсумковий звіт після концерту.",
      isPublished: true,
    },
  });
  const programEnglish = await prisma.clubProgram.create({
    data: {
      clubId: clubEnglish.id,
      title: "English Intensive for Teens",
      subjectArea: "Англійська мова",
      shortDescription:
        "Розмовна англійська, читання, граматика та коротке письмо для учнів середньої школи.",
      fullDescription:
        "Програма побудована навколо speaking club, роботи з текстами, grammar workshop та письмових завдань. Учні регулярно роблять короткі презентації, пишуть листи й абзаци та ведуть персональний словник.",
      ageMin: 11,
      ageMax: 15,
      gradeMin: 6,
      gradeMax: 9,
      modules: [
        "Speaking club і діалоги",
        "Reading stories and articles",
        "Grammar workshop",
        "Writing short texts",
      ],
      learningOutcomes: [
        "Учень підтримує діалог англійською мовою в типових ситуаціях.",
        "Пише короткі листи та абзаци.",
        "Розуміє автентичні тексти відповідного рівня.",
      ],
      evaluationMethod:
        "Усні презентації, мовні чеклісти, короткі письмові роботи та підсумковий progress report.",
      reportFormatSummary: "Щомісячний progress report англійською та українською.",
      isPublished: true,
    },
  });
  const programRobotics = await prisma.clubProgram.create({
    data: {
      clubId: clubVector.id,
      title: "Robotics Lab Junior",
      subjectArea: "Інформатика",
      shortDescription:
        "Основи алгоритмів, програмування та роботи з датчиками через командні проєкти.",
      fullDescription:
        "Програма поєднує Scratch, базовий Python, роботу з сенсорами й простими роботами. Учні збирають командні проєкти, тестують алгоритми та презентують логіку своїх рішень.",
      ageMin: 9,
      ageMax: 14,
      gradeMin: 3,
      gradeMax: 8,
      modules: [
        "Scratch та Python основи",
        "Сенсори і прості алгоритми",
        "Командний проєкт робота",
      ],
      learningOutcomes: [
        "Учень складає алгоритм та налагоджує просту програму.",
        "Працює з датчиками й описує логіку роботи системи.",
        "Презентує командний STEM-проєкт.",
      ],
      evaluationMethod:
        "Демонстрація проєкту та рубрика для командної роботи, але без окремого індивідуального письмового звіту.",
      reportFormatSummary: "Підсумкова картка проєкту та короткий коментар ментора.",
      isPublished: true,
    },
  });
  const programSwimming = await prisma.clubProgram.create({
    data: {
      clubId: clubVector.id,
      title: "Swimming Focus",
      subjectArea: "Фізична культура",
      shortDescription:
        "Техніка плавання, координація, витривалість та безпечна участь у тренуваннях.",
      fullDescription:
        "Програма охоплює техніку кроля та на спині, дихання, координацію, вправи на витривалість і безпечну поведінку у воді. Заняття проходять двічі на тиждень у малих групах.",
      ageMin: 8,
      ageMax: 15,
      gradeMin: 2,
      gradeMax: 9,
      modules: [
        "Техніка кроля та на спині",
        "Дихання та координація",
        "Вправи на витривалість",
      ],
      learningOutcomes: [
        "Учень безпечно виконує базові стилі плавання.",
        "Підтримує регулярний руховий режим.",
        "Дотримується правил безпеки під час занять.",
      ],
      evaluationMethod:
        "Тренерський лист спостереження, перевірка техніки та підсумковий норматив наприкінці модуля.",
      reportFormatSummary: "Короткий звіт тренера та відсоток відвідуваності.",
      isPublished: true,
    },
  });

  const seededRequests = [
    {
      childId: childMarta.id,
      parentProfileId: parentOne.id,
      schoolId: schoolOne.id,
      clubId: clubEnglish.id,
      clubProgramId: programEnglish.id,
      targetSubject: "Англійська мова",
      targetGrade: 7,
      recognitionScope: RecognitionScope.FULL,
      parentNote:
        "Просимо школу розглянути програму гуртка як підставу для частини предметного навантаження.",
      clubEvidenceSummary: null,
      attendanceRate: null,
      externalPerformanceBand: null,
      status: RecognitionRequestStatus.AI_READY,
      decision: null,
    },
    {
      childId: childSofiia.id,
      parentProfileId: parentTwo.id,
      schoolId: schoolTwo.id,
      clubId: clubMusic.id,
      clubProgramId: programPiano.id,
      targetSubject: "Мистецтво",
      targetGrade: 8,
      recognitionScope: RecognitionScope.FULL,
      parentNote: "Софія навчається у музичній школі другий рік і має регулярні виступи.",
      clubEvidenceSummary:
        "Викладач надав підсумковий опис виконаних творів, слухових вправ і сценічної практики.",
      attendanceRate: 98,
      externalPerformanceBand: "високий",
      status: RecognitionRequestStatus.APPROVED,
      decision: {
        decision: SchoolDecision.APPROVE,
        comment:
          "Школа враховує програму як достатньо структуровану для розгляду та погоджує повне визнання в межах шкільного рішення.",
        recognizedTopics: [
          "виконавська практика",
          "музична мова",
          "ритм та слухання",
        ],
      },
    },
    {
      childId: childDenys.id,
      parentProfileId: parentOne.id,
      schoolId: schoolOne.id,
      clubId: clubVector.id,
      clubProgramId: programRobotics.id,
      targetSubject: "Інформатика",
      targetGrade: 4,
      recognitionScope: RecognitionScope.PARTIAL,
      parentNote:
        "Хочемо, щоб школа врахувала клуб як частину практичного блоку з інформатики.",
      clubEvidenceSummary:
        "Ментор описав командний проєкт і модулі з алгоритмів, але без індивідуальної рубрики для кожної дитини.",
      attendanceRate: 91,
      externalPerformanceBand: "стійкий прогрес",
      status: RecognitionRequestStatus.CHANGES_REQUESTED,
      decision: {
        decision: SchoolDecision.REQUEST_CHANGES,
        comment:
          "Потрібно додати індивідуальні критерії оцінювання та короткий опис внеску дитини в командний проєкт.",
        recognizedTopics: ["алгоритмічне мислення", "командний STEM-проєкт"],
      },
    },
    {
      childId: childMarta.id,
      parentProfileId: parentOne.id,
      schoolId: schoolOne.id,
      clubId: clubVector.id,
      clubProgramId: programSwimming.id,
      targetSubject: "Фізична культура",
      targetGrade: 7,
      recognitionScope: RecognitionScope.PARTIAL,
      parentNote:
        "Просимо врахувати регулярні тренування з плавання як частину рухової активності.",
      clubEvidenceSummary:
        "Тренер підтверджує регулярну відвідуваність, технічний прогрес та дотримання правил безпеки.",
      attendanceRate: 96,
      externalPerformanceBand: "високий",
      status: RecognitionRequestStatus.PARTIALLY_APPROVED,
      decision: {
        decision: SchoolDecision.PARTIAL,
        comment:
          "Школа погоджується врахувати частину рухової активності та техніку, але залишає за собою окрему перевірку шкільних нормативів.",
        recognizedTopics: ["техніка плавання", "рухова активність", "безпечна участь"],
      },
    },
  ] as const;

  for (const seededRequest of seededRequests) {
    const program =
      seededRequest.clubProgramId === programEnglish.id
        ? programEnglish
        : seededRequest.clubProgramId === programPiano.id
          ? programPiano
          : seededRequest.clubProgramId === programRobotics.id
            ? programRobotics
            : programSwimming;
    const analysis = generateHeuristicRecommendationBand({
      programTitle: program.title,
      subjectArea: program.subjectArea,
      shortDescription: program.shortDescription,
      fullDescription: program.fullDescription,
      modules: Array.isArray(program.modules)
        ? program.modules.filter((value): value is string => typeof value === "string")
        : [],
      learningOutcomes: Array.isArray(program.learningOutcomes)
        ? program.learningOutcomes.filter((value): value is string => typeof value === "string")
        : [],
      evaluationMethod: program.evaluationMethod,
      reportFormatSummary: program.reportFormatSummary,
      clubEvidenceSummary: seededRequest.clubEvidenceSummary,
      targetSubject: seededRequest.targetSubject,
      targetGrade: seededRequest.targetGrade,
      recognitionScope: seededRequest.recognitionScope,
      ageMin: program.ageMin,
      ageMax: program.ageMax,
      gradeMin: program.gradeMin,
      gradeMax: program.gradeMax,
    });
    const createdRequest = await prisma.recognitionRequest.create({
      data: {
        childId: seededRequest.childId,
        parentProfileId: seededRequest.parentProfileId,
        schoolId: seededRequest.schoolId,
        clubId: seededRequest.clubId,
        clubProgramId: seededRequest.clubProgramId,
        targetSubject: seededRequest.targetSubject,
        targetGrade: seededRequest.targetGrade,
        recognitionScope: seededRequest.recognitionScope,
        parentNote: seededRequest.parentNote,
        clubEvidenceSummary: seededRequest.clubEvidenceSummary,
        attendanceRate: seededRequest.attendanceRate,
        externalPerformanceBand: seededRequest.externalPerformanceBand,
        status: seededRequest.status,
      },
    });

    await prisma.recognitionAiAnalysis.create({
      data: {
        requestId: createdRequest.id,
        provider: analysis.provider,
        modelName: analysis.modelName,
        compatibilityScore: analysis.compatibilityScore,
        recommendationBand: analysis.recommendationBand,
        recommendedSchoolAction: analysis.recommendedSchoolAction,
        confidence: analysis.confidence,
        summary: analysis.summary,
        matchedOutcomes: analysis.matchedOutcomes,
        gaps: analysis.gaps,
        suggestedEvidence: analysis.suggestedEvidence,
        safeBandExplanation: analysis.safeBandExplanation,
        rawResponse: analysis.rawResponse,
      },
    });

    if (seededRequest.decision) {
      await prisma.recognitionDecision.create({
        data: {
          requestId: createdRequest.id,
          schoolId: seededRequest.schoolId,
          decision: seededRequest.decision.decision,
          comment: seededRequest.decision.comment,
          recognizedTopics: seededRequest.decision.recognizedTopics,
          decidedAt: new Date(),
        },
      });
    }
  }

  console.log("Seed completed.");
  console.log(`Demo password for all seeded accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
