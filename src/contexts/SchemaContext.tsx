// src/contexts/SchemaContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

// ——————————— Definiciones de tipos ———————————

export interface FieldDef {
  name: string;
  type: string;
  required: boolean;
}

export interface TableDef {
  name: string;
  fields: FieldDef[];
}

export interface Relationship {
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  targetField: string;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
}

export interface SchemaDef {
  tables: TableDef[];
  relationships: Relationship[];
}

export type RowData = Record<string, any>;

export type DataDef = {
  [tableName: string]: RowData[];
};

export interface FullState {
  schema: SchemaDef;
  data: DataDef;
}

export interface SchemaContextValue {
  fullState: FullState | null;
  loading: boolean;

  setSchema: (newSchema: SchemaDef) => void;
  addTable: (tableName: string) => void;
  removeTable: (tableName: string) => void;
  renameTable: (oldName: string, newName: string) => void;

  addField: (tableName: string, field: FieldDef) => void;
  updateField: (tableName: string, oldFieldName: string, newField: FieldDef) => void;
  removeField: (tableName: string, fieldName: string) => void;

  addRelationship: (rel: Relationship) => void;
  removeRelationship: (relId: number) => void;

  addRow: (tableName: string, row: RowData) => void;
  updateRow: (tableName: string, rowIndex: number, newRow: RowData) => void;
  removeRow: (tableName: string, rowIndex: number) => void;

  clearAll: () => void;
}

const SchemaContext = createContext<SchemaContextValue | undefined>(undefined);

const LS_KEY = 'sqlJsonEditorState';

export const SchemaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fullState, setFullState] = useState<FullState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const json = window.localStorage.getItem(LS_KEY);
    if (json) {
      try {
        const parsed: FullState = JSON.parse(json);
        setFullState(parsed);
      } catch (e) {
        console.warn('No se pudo parsear localStorage:', e);
        setFullState({
          schema: { tables: [], relationships: [] },
          data: {},
        });
      }
    } else {
      setFullState({
        schema: { tables: [], relationships: [] },
        data: {},
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && fullState !== null) {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(fullState));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
    }
  }, [fullState, loading]);

  const pushState = (nextState: FullState) => {
    setFullState(nextState);
  };

  const setSchema = (newSchema: SchemaDef) => {
    if (!fullState) return;
    const newData: DataDef = {};
    newSchema.tables.forEach((t) => {
      if (fullState.data[t.name]) newData[t.name] = fullState.data[t.name];
      else newData[t.name] = [];
    });
    pushState({ schema: { ...newSchema }, data: newData });
  };

  const addTable = (tableName: string) => {
    if (!fullState) return;
    if (fullState.schema.tables.find((t) => t.name === tableName)) return;
    const newTable: TableDef = { name: tableName, fields: [] };
    const updatedSchema: SchemaDef = {
      ...fullState.schema,
      tables: [...fullState.schema.tables, newTable],
    };
    const updatedData: DataDef = { ...fullState.data, [tableName]: [] };
    pushState({ schema: updatedSchema, data: updatedData });
  };

  const removeTable = (tableName: string) => {
    if (!fullState) return;
    const filteredTables = fullState.schema.tables.filter((t) => t.name !== tableName);
    const filteredRels = fullState.schema.relationships.filter(
      (rel) => rel.sourceTable !== tableName && rel.targetTable !== tableName
    );
    const updatedSchema: SchemaDef = { tables: filteredTables, relationships: filteredRels };
    const { [tableName]: __, ...restData } = fullState.data;
    pushState({ schema: updatedSchema, data: restData });
  };

  const renameTable = (oldName: string, newName: string) => {
    if (!fullState) return;
    if (fullState.schema.tables.find((t) => t.name === newName)) return;
    const updatedTables = fullState.schema.tables.map((t) =>
      t.name === oldName ? { ...t, name: newName } : t
    );
    const updatedRels = fullState.schema.relationships.map((rel) => {
      let r = { ...rel };
      if (r.sourceTable === oldName) r.sourceTable = newName;
      if (r.targetTable === oldName) r.targetTable = newName;
      return r;
    });
    const newData: DataDef = { ...fullState.data };
    if (fullState.data[oldName]) {
      newData[newName] = fullState.data[oldName];
      delete newData[oldName];
    }
    pushState({ schema: { tables: updatedTables, relationships: updatedRels }, data: newData });
  };

  const addField = (tableName: string, field: FieldDef) => {
    if (!fullState) return;
    const updatedTables = fullState.schema.tables.map((t) => {
      if (t.name === tableName) {
        if (t.fields.find((f) => f.name === field.name)) return t;
        return { ...t, fields: [...t.fields, field] };
      }
      return t;
    });
    pushState({ schema: { ...fullState.schema, tables: updatedTables }, data: fullState.data });
  };

  const updateField = (tableName: string, oldFieldName: string, newField: FieldDef) => {
    if (!fullState) return;
    const updatedTables = fullState.schema.tables.map((t) => {
      if (t.name === tableName) {
        const newFields = t.fields.map((f) => (f.name === oldFieldName ? newField : f));
        return { ...t, fields: newFields };
      }
      return t;
    });
    const updatedRels = fullState.schema.relationships.map((rel) => {
      if (rel.sourceTable === tableName && rel.sourceField === oldFieldName) {
        return { ...rel, sourceField: newField.name };
      }
      if (rel.targetTable === tableName && rel.targetField === oldFieldName) {
        return { ...rel, targetField: newField.name };
      }
      return rel;
    });
    pushState({ schema: { tables: updatedTables, relationships: updatedRels }, data: fullState.data });
  };

  const removeField = (tableName: string, fieldName: string) => {
    if (!fullState) return;
    const updatedTables = fullState.schema.tables.map((t) => {
      if (t.name === tableName) {
        return { ...t, fields: t.fields.filter((f) => f.name !== fieldName) };
      }
      return t;
    });
    const updatedRels = fullState.schema.relationships.filter(
      (rel) =>
        !(
          (rel.sourceTable === tableName && rel.sourceField === fieldName) ||
          (rel.targetTable === tableName && rel.targetField === fieldName)
        )
    );
    pushState({ schema: { tables: updatedTables, relationships: updatedRels }, data: fullState.data });
  };

  const addRelationship = (rel: Relationship) => {
    if (!fullState) return;
    const exists = fullState.schema.relationships.find(
      (r) =>
        r.sourceTable === rel.sourceTable &&
        r.sourceField === rel.sourceField &&
        r.targetTable === rel.targetTable &&
        r.targetField === rel.targetField &&
        r.cardinality === rel.cardinality
    );
    if (exists) return;
    pushState({
      schema: {
        tables: fullState.schema.tables,
        relationships: [...fullState.schema.relationships, rel],
      },
      data: fullState.data,
    });
  };

  const removeRelationship = (relId: number) => {
    if (!fullState) return;
    const newRels = fullState.schema.relationships.filter((_r, idx) => idx !== relId);
    pushState({ schema: { tables: fullState.schema.tables, relationships: newRels }, data: fullState.data });
  };

  const addRow = (tableName: string, row: RowData) => {
    if (!fullState) return;
    if (!fullState.schema.tables.find((t) => t.name === tableName)) return;
    const prevRows = fullState.data[tableName] || [];
    const newRows = [...prevRows, row];
    pushState({ schema: fullState.schema, data: { ...fullState.data, [tableName]: newRows } });
  };

  const updateRow = (tableName: string, rowIndex: number, newRow: RowData) => {
    if (!fullState) return;
    if (!fullState.data[tableName]) return;
    const prevRows = fullState.data[tableName];
    if (rowIndex < 0 || rowIndex >= prevRows.length) return;
    const newRows = [...prevRows];
    newRows[rowIndex] = newRow;
    pushState({ schema: fullState.schema, data: { ...fullState.data, [tableName]: newRows } });
  };

  const removeRow = (tableName: string, rowIndex: number) => {
    if (!fullState) return;
    if (!fullState.data[tableName]) return;
    const prevRows = fullState.data[tableName];
    if (rowIndex < 0 || rowIndex >= prevRows.length) return;
    const newRows = prevRows.filter((_r, idx) => idx !== rowIndex);
    pushState({ schema: fullState.schema, data: { ...fullState.data, [tableName]: newRows } });
  };

  const clearAll = () => {
    const initialState: FullState = { schema: { tables: [], relationships: [] }, data: {} };
    pushState(initialState);
    window.localStorage.removeItem(LS_KEY);
  };

  const value: SchemaContextValue = {
    fullState,
    loading,
    setSchema,
    addTable,
    removeTable,
    renameTable,
    addField,
    updateField,
    removeField,
    addRelationship,
    removeRelationship,
    addRow,
    updateRow,
    removeRow,
    clearAll,
  };

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
};

export function useSchema() {
  const ctx = useContext(SchemaContext);
  if (!ctx) throw new Error('useSchema debe usarse dentro de <SchemaProvider>');
  return ctx;
}
