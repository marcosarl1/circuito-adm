export function toDateTimeLocal(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toISOString();
}
