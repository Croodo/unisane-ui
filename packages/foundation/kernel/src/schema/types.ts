export type FieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | {
      type: 'enum';
      ref: string; // References ENUM_CONSTANTS key
      default?: string; // Optional default value
    }
  | { type: 'reference'; collection: string }
  | { type: 'object'; schema: SchemaDefinition };

export type SchemaDefinition = Record<string, FieldType | { 
  type: FieldType; 
  nullable?: boolean;
}>;

export interface EntitySchema {
  collection: string;
  schema: SchemaDefinition;
}
