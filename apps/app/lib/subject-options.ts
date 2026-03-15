export const subjectOptions = [
  "Англійська мова",
  "Мистецтво",
  "Фізична культура",
  "Інформатика",
  "Математика",
  "Природничі науки",
  "Технології",
] as const;

export type SubjectOption = (typeof subjectOptions)[number];
