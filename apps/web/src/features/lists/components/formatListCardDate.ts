const SPANISH_LONG_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatListCardDate = (value: string) => {
  const dateParts = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/u);

  if (!dateParts) {
    return value;
  }

  const [, rawYear, rawMonth, rawDay] = dateParts;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);

  if (!year || !month || !day) {
    return value;
  }

  const normalizedDate = new Date(Date.UTC(year, month - 1, day));
  const formattedParts = SPANISH_LONG_DATE_FORMATTER.formatToParts(normalizedDate);
  const formattedDay = formattedParts.find(({ type }) => type === "day")?.value;
  const formattedMonth = formattedParts.find(({ type }) => type === "month")?.value;
  const formattedYear = formattedParts.find(({ type }) => type === "year")?.value;

  if (!formattedDay || !formattedMonth || !formattedYear) {
    return SPANISH_LONG_DATE_FORMATTER.format(normalizedDate);
  }

  return `${formattedDay} ${formattedMonth}, ${formattedYear}`;
};
