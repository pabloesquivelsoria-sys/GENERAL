// Une nombres de clases y descarta valores falsy (false, null, undefined, '').
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter((value): value is string => Boolean(value)).join(' ');
}
