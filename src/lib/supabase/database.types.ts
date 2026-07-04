export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    };
    Views: Record<string, any>;
    Functions: {
      [key: string]: {
        Args: any;
        Returns: any;
      };
    };
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
};
