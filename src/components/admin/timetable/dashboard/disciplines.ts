export type DisciplineKey = "stem" | "lang" | "social" | "arts" | "study";

export const DISCIPLINES: { key: DisciplineKey; label: string; short: string; dot: string; chip: string; stripe: string }[] = [
  { key: "stem", label: "STEM & Math", short: "CORE", dot: "bg-discipline-stem", chip: "bg-discipline-stem/10 text-discipline-stem", stripe: "bg-discipline-stem" },
  { key: "lang", label: "Languages", short: "LIT", dot: "bg-discipline-lang", chip: "bg-discipline-lang/10 text-discipline-lang", stripe: "bg-discipline-lang" },
  { key: "social", label: "Social & Env", short: "ENV", dot: "bg-discipline-social", chip: "bg-discipline-social/10 text-discipline-social", stripe: "bg-discipline-social" },
  { key: "arts", label: "Arts & PE", short: "ARTS", dot: "bg-discipline-arts", chip: "bg-discipline-arts/10 text-discipline-arts", stripe: "bg-discipline-arts" },
  { key: "study", label: "Study & Advisory", short: "STUDY", dot: "bg-discipline-study", chip: "bg-discipline-study/10 text-discipline-study", stripe: "bg-discipline-study" },
];

export const disciplineOf = (subject: string): DisciplineKey => {
  const s = (subject || "").toLowerCase();
  if (/math|algebra|geometr|scien|physic|chem|bio|comput|ict|informat|techn|engineer/.test(s)) return "stem";
  if (/english|hindi|language|literat|sanskrit|tamil|bengali|marathi|kannada|urdu|french|german|assam/.test(s)) return "lang";
  if (/social|histor|civic|geograph|evs|environment|econom|polit|business|commerce|account/.test(s)) return "social";
  if (/art|music|danc|drama|craft|physical|sport|pe\b|yoga|health/.test(s)) return "arts";
  if (/librar|advisor|study|free|club|assembly|moral|value/.test(s)) return "study";
  return "stem";
};

export const meta = (key: DisciplineKey) => DISCIPLINES.find((d) => d.key === key)!;
