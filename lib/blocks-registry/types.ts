export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "color"
  | "password";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  icon?: string;
  hint?: string;
  default: string;
  options?: FieldOption[];
  /** מקבץ שדות תחת אותה כותרת בפאנל העריכה */
  group?: string;
  /** שדה רגיש שלא אמור להיחשף בקוד הלקוח - מטופל ע"י ה-backend בלבד */
  serverOnly?: boolean;
}

export type BlockValues = Record<string, string>;

export interface BlockMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: "assistant" | "forms" | "marketing" | "social-proof";
}

export interface BlockDefinition {
  meta: BlockMeta;
  fields: FieldDef[];
  defaultValues: () => BlockValues;
  /** מייצר את קוד ההטמעה הבטוח (ללא שדות serverOnly) */
  generate: (values: BlockValues, blockId?: string) => string;
  /** קומפוננטת React לתצוגה חיה בעורך */
  Preview: React.ComponentType<{ values: BlockValues }>;
}
