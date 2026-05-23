/**
 * Development stub for Supabase database types.
 * Replace with the real generated file by running: npm run db:types
 *
 * This stub uses `any` everywhere so all .from().select/insert/update()
 * calls type-check without the real schema.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<
      string,
      {
        Row:    AnyRecord;
        Insert: AnyRecord;
        Update: AnyRecord;
        Relationships: unknown[];
      }
    >;
    Views: Record<string, { Row: AnyRecord }>;
    Functions: Record<string, { Args: AnyRecord; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, AnyRecord>;
  };
}
