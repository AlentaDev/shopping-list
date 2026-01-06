export const formatEuro = (value: number): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatUnitPrice = (value: number, unit: string): string =>
  `${formatEuro(value)} / ${unit}`;
