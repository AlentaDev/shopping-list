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
  const formattedDate = SPANISH_LONG_DATE_FORMATTER.format(normalizedDate).replace(
    /\sde\s/gu,
    " ",
  );
  const normalizedParts = formattedDate.match(/^(\d{1,2})\s+(.+?)\s+(\d{4})$/u);

  if (!normalizedParts) {
    return formattedDate;
  }

  const [, formattedDay, formattedMonth, formattedYear] = normalizedParts;

  return `${formattedDay} ${formattedMonth.trim()}, ${formattedYear}`;
};
