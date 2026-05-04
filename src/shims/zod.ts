/* Minimal local shim for zod-like API used in this repository.
 * NOTE: This is a stopgap for restricted environments where npm install is blocked.
 */

export class ZodError extends Error {
  constructor(public issues: Array<{ message: string }>) {
    super("Validation failed");
  }
}

export const ZodIssueCode = { custom: "custom" } as const;

type ParseResult<T> = { success: true; data: T } | { success: false; error: ZodError };

type Check<T> = (value: T) => string | null;

class Schema<T> {
  constructor(private readonly parser: (payload: unknown) => T) {}

  safeParse(payload: unknown): ParseResult<T> {
    try {
      return { success: true, data: this.parser(payload) };
    } catch (e) {
      if (e instanceof ZodError) return { success: false, error: e };
      return { success: false, error: new ZodError([{ message: "invalid payload" }]) };
    }
  }

  transform<U>(fn: (v: T) => U): Schema<U> {
    return new Schema((payload) => fn(this.parser(payload)));
  }

  default(defaultValue: T): Schema<T> {
    return new Schema((payload) => (payload === undefined ? defaultValue : this.parser(payload)));
  }

  optional(): Schema<T | undefined> {
    return new Schema((payload) => (payload === undefined ? undefined : this.parser(payload)));
  }

  superRefine(fn: (value: T, ctx: { addIssue: (issue: { message: string; code?: string }) => void }) => void): Schema<T> {
    return new Schema((payload) => {
      const value = this.parser(payload);
      const issues: Array<{ message: string }> = [];
      fn(value, { addIssue: (issue) => issues.push({ message: issue.message }) });
      if (issues.length) throw new ZodError(issues);
      return value;
    });
  }
}

class StringSchema extends Schema<string> {
  constructor() {
    super((payload) => {
      if (typeof payload !== "string") throw new ZodError([{ message: "expected string" }]);
      return payload;
    });
  }

  private withCheck(check: Check<string>): StringSchema {
    const baseParse = this.safeParse.bind(this);
    return new StringSchemaFrom((payload) => {
      const r = baseParse(payload);
      if (!r.success) throw r.error;
      const msg = check(r.data);
      if (msg) throw new ZodError([{ message: msg }]);
      return r.data;
    });
  }

  trim(): StringSchema { return new StringSchemaFrom((p) => this.parseRaw(p).trim()); }
  length(n: number): StringSchema { return this.withCheck((v) => (v.length === n ? null : `must have length ${n}`)); }
  min(n: number): StringSchema { return this.withCheck((v) => (v.length >= n ? null : `must be at least ${n}`)); }
  max(n: number): StringSchema { return this.withCheck((v) => (v.length <= n ? null : `must be at most ${n}`)); }
  email(): StringSchema { return this.withCheck((v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "invalid email")); }
  uuid(): StringSchema { return this.withCheck((v) => (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? null : "invalid uuid")); }
  date(): StringSchema { return this.withCheck((v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? null : "invalid date")); }
  regex(re: RegExp): StringSchema { return this.withCheck((v) => (re.test(v) ? null : "invalid format")); }

  parseRaw(payload: unknown): string {
    const r = this.safeParse(payload);
    if (!r.success) throw r.error;
    return r.data;
  }
}
class StringSchemaFrom extends StringSchema {
  constructor(private readonly p: (payload: unknown) => string) { super(); }
  override parseRaw(payload: unknown): string { return this.p(payload); }
  override safeParse(payload: unknown): ParseResult<string> {
    try { return { success: true, data: this.p(payload) }; } catch (e) { return { success: false, error: e as ZodError }; }
  }
}

class NumberSchema extends Schema<number> {
  constructor() {
    super((payload) => {
      if (typeof payload !== "number" || Number.isNaN(payload)) throw new ZodError([{ message: "expected number" }]);
      return payload;
    });
  }
  nonnegative(): NumberSchema { return new NumberSchemaFrom((v) => this.check(v, (n) => n >= 0, "must be nonnegative")); }
  finite(): NumberSchema { return new NumberSchemaFrom((v) => this.check(v, Number.isFinite, "must be finite")); }
  int(): NumberSchema { return new NumberSchemaFrom((v) => this.check(v, Number.isInteger, "must be integer")); }
  min(n: number): NumberSchema { return new NumberSchemaFrom((v) => this.check(v, (x) => x >= n, `must be >= ${n}`)); }
  max(n: number): NumberSchema { return new NumberSchemaFrom((v) => this.check(v, (x) => x <= n, `must be <= ${n}`)); }
  private check(payload: unknown, fn: (v: number) => boolean, msg: string): number { const v = this.parseRaw(payload); if (!fn(v)) throw new ZodError([{ message: msg }]); return v; }
  parseRaw(payload: unknown): number { const r = this.safeParse(payload); if (!r.success) throw r.error; return r.data; }
}
class NumberSchemaFrom extends NumberSchema {
  constructor(private readonly p: (payload: unknown) => number) { super(); }
  override parseRaw(payload: unknown): number { return this.p(payload); }
  override safeParse(payload: unknown): ParseResult<number> { try { return { success: true, data: this.p(payload) }; } catch (e) { return { success: false, error: e as ZodError }; } }
}

class BooleanSchema extends Schema<boolean> {
  constructor() { super((payload) => { if (typeof payload !== "boolean") throw new ZodError([{ message: "expected boolean" }]); return payload; }); }
}

class EnumSchema<T extends string> extends Schema<T> {
  constructor(values: readonly T[]) { super((payload) => { if (typeof payload !== "string" || !values.includes(payload as T)) throw new ZodError([{ message: "invalid enum" }]); return payload as T; }); }
}

class ObjectSchema<T extends Record<string, unknown>> extends Schema<T> {
  constructor(shape: Record<string, Schema<unknown>>) {
    super((payload) => {
      if (typeof payload !== "object" || payload === null) throw new ZodError([{ message: "expected object" }]);
      const out: Record<string, unknown> = {};
      for (const [k, schema] of Object.entries(shape)) {
        const r = schema.safeParse((payload as Record<string, unknown>)[k]);
        if (!r.success) throw new ZodError(r.error.issues.map((i) => ({ message: `${k}: ${i.message}` })));
        if (r.data !== undefined) out[k] = r.data;
      }
      return out as T;
    });
  }
}

export const z = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  enum: <T extends readonly string[]>(values: T) => new EnumSchema(values),
  object: <T extends Record<string, Schema<unknown>>>(shape: T) => new ObjectSchema(shape as Record<string, Schema<unknown>>),
  ZodIssueCode,
  ZodType: Schema
};

export type ZodType<T> = Schema<T>;
export type infer<T> = T extends Schema<infer U> ? U : never;
