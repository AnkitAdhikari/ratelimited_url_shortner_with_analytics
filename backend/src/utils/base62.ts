import { InternalServerError } from './errors/app.errors.js';

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = 62;
const ALIAS_LENGTH = 6;

export function toBase62(num: number): string {
  if (num === 0) throw new InternalServerError('Cannot convert 0 to base62');

  let result = '';
  while (num > 0) {
    result = CHARSET[num % BASE] + result;
    num = Math.floor(num / BASE);
  }

  if (result.length > ALIAS_LENGTH) {
    throw new InternalServerError(
      `ID ${num} exceeds base62 capacity for a ${ALIAS_LENGTH}-char alias`,
    );
  }

  return result.padStart(ALIAS_LENGTH, CHARSET[0]);
}
