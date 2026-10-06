import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 25;
}

export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
}

export function paged<T>(data: T[], total: number, q: PageQuery): Paged<T> {
  return { data, meta: { page: q.page, limit: q.limit, total, pages: Math.max(1, Math.ceil(total / q.limit)) } };
}

/** Constructor mínimo de cláusulas WHERE parametrizadas ($1, $2, ...). */
export class Where {
  private conds: string[] = [];
  readonly params: unknown[] = [];

  add(sql: string, value: unknown): this {
    if (value === undefined || value === null || value === '') return this;
    this.params.push(value);
    this.conds.push(sql.split('?').join(`$${this.params.length}`)); // un mismo valor puede usarse en varios '?'
    return this;
  }

  raw(sql: string): this {
    this.conds.push(sql);
    return this;
  }

  get sql(): string {
    return this.conds.length ? `WHERE ${this.conds.join(' AND ')}` : '';
  }
}
