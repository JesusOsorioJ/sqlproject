// src/contexts/SchemaContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

// ——————————— Definiciones de tipos ———————————

export interface FieldDef {
  name: string;
  type: string;   // e.g. 'VARCHAR(100)', 'INT', 'DATE', etc.
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
}

export interface SchemaDef {
  tables: TableDef[];
  relationships: Relationship[];
}

/** Cada fila es un objeto { [campo: string]: valor }. */
export type RowData = Record<string, any>;

/** DataDef: para cada tabla guardamos un array de filas. */
export type DataDef = {
  [tableName: string]: RowData[];
};

export interface FullState {
  schema: SchemaDef;
  data: DataDef;
}

// ——— Interfaz del Contexto —————————————————————
export interface SchemaContextValue {
  fullState: FullState | null;
  loading: boolean;

  // operaciones sobre el esquema
  setSchema: (newSchema: SchemaDef) => void;
  addTable: (tableName: string) => void;
  removeTable: (tableName: string) => void;
  renameTable: (oldName: string, newName: string) => void;

  addField: (
    tableName: string,
    field: FieldDef
  ) => void;
  updateField: (
    tableName: string,
    oldFieldName: string,
    newField: FieldDef
  ) => void;
  removeField: (tableName: string, fieldName: string) => void;

  addRelationship: (rel: Relationship) => void;
  removeRelationship: (relId: number) => void; // usaremos índice para identif.

  // operaciones sobre datos
  addRow: (tableName: string, row: RowData) => void;
  updateRow: (
    tableName: string,
    rowIndex: number,
    newRow: RowData
  ) => void;
  removeRow: (tableName: string, rowIndex: number) => void;
}

const SchemaContext = createContext<SchemaContextValue | undefined>(undefined);

// ——— Claves para localStorage —————————————————————
const LS_KEY = "sqlJsonEditorState";

// ——— Proveedor del Contexto —————————————————————
export const SchemaProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [fullState, setFullState] = useState<FullState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1) Al montar, intentamos cargar de localStorage
  useEffect(() => {
    const json = window.localStorage.getItem(LS_KEY);
    if (json) {
      try {
        const parsed: FullState = JSON.parse(json);
        setFullState(parsed);
      } catch (e) {
        console.warn("No se pudo parsear localStorage:", e);
        // inicializamos en blanco
        setFullState({
          schema: { tables: [], relationships: [] },
          data: {},
        });
      }
    } else {
      // Estado inicial vacío
      setFullState({
        schema: { tables: [], relationships: [] },
        data: {},
      });
    }
    setLoading(false);
  }, []);

  // 2) Cada vez que cambie fullState, persistimos en localStorage
  useEffect(() => {
    if (!loading && fullState !== null) {
      try {
        window.localStorage.setItem(
          LS_KEY,
          JSON.stringify(fullState)
        );
      } catch (e) {
        console.error("Error guardando en localStorage:", e);
      }
    }
  }, [fullState, loading]);

  // ——— Funciones auxiliares —————————————————————

  const pushState = (nextState: FullState) => {
    setFullState(nextState);
  };

  // ——— Operaciones sobre el esquema —————————————————————

  const setSchema = (newSchema: SchemaDef) => {
    if (!fullState) return;
    // Si cambiamos el esquema, limpiamos también data de tablas borradas
    const newData: DataDef = {};
    newSchema.tables.forEach((t) => {
      if (fullState.data[t.name]) {
        newData[t.name] = fullState.data[t.name];
      } else {
        newData[t.name] = [];
      }
    });
    const updatedState: FullState = {
      schema: { ...newSchema },
      data: newData,
    };
    pushState(updatedState);
  };

  const addTable = (tableName: string) => {
    if (!fullState) return;
    // Evitamos duplicados
    if (
      fullState.schema.tables.find((t) => t.name === tableName)
    ) {
      return;
    }
    const newTable: TableDef = {
      name: tableName,
      fields: [],
    };
    const updatedSchema: SchemaDef = {
      ...fullState.schema,
      tables: [...fullState.schema.tables, newTable],
    };
    const updatedData: DataDef = {
      ...fullState.data,
      [tableName]: [],
    };
    pushState({ schema: updatedSchema, data: updatedData });
  };

  const removeTable = (tableName: string) => {
    if (!fullState) return;
    const filteredTables = fullState.schema.tables.filter(
      (t) => t.name !== tableName
    );
    // También eliminamos relaciones que involucren a esta tabla
    const filteredRels = fullState.schema.relationships.filter(
      (rel) =>
        rel.sourceTable !== tableName &&
        rel.targetTable !== tableName
    );
    const updatedSchema: SchemaDef = {
      tables: filteredTables,
      relationships: filteredRels,
    };
    const { [tableName]: __, ...restData } = fullState.data;
    const updatedState: FullState = {
      schema: updatedSchema,
      data: restData,
    };
    pushState(updatedState);
  };

  const renameTable = (oldName: string, newName: string) => {
    if (!fullState) return;
    if (
      fullState.schema.tables.find((t) => t.name === newName)
    ) {
      // No permitimos dos tablas con el mismo nombre
      return;
    }
    const updatedTables = fullState.schema.tables.map((t) =>
      t.name === oldName ? { ...t, name: newName } : t
    );
    // Actualizamos relaciones
    const updatedRels = fullState.schema.relationships.map(
      (rel) => {
        let r = { ...rel };
        if (r.sourceTable === oldName) {
          r.sourceTable = newName;
        }
        if (r.targetTable === oldName) {
          r.targetTable = newName;
        }
        return r;
      }
    );
    // Actualizamos data: movemos arreglo de filas a nueva key
    const newData: DataDef = { ...fullState.data };
    if (fullState.data[oldName]) {
      newData[newName] = fullState.data[oldName];
      delete newData[oldName];
    }
    const updatedSchema: SchemaDef = {
      tables: updatedTables,
      relationships: updatedRels,
    };
    pushState({ schema: updatedSchema, data: newData });
  };

  const addField = (
    tableName: string,
    field: FieldDef
  ) => {
    if (!fullState) return;
    const updatedTables = fullState.schema.tables.map((t) => {
      if (t.name === tableName) {
        // Evitamos duplicar campo
        if (t.fields.find((f) => f.name === field.name)) {
          return t;
        }
        return { ...t, fields: [...t.fields, field] };
      }
      return t;
    });
    pushState({
      schema: { ...fullState.schema, tables: updatedTables },
      data: fullState.data,
    });
  };

  const updateField = (
    tableName: string,
    oldFieldName: string,
    newField: FieldDef
  ) => {
    if (!fullState) return;
    const updatedTables = fullState.schema.tables.map((t) => {
      if (t.name === tableName) {
        const newFields = t.fields.map((f) =>
          f.name === oldFieldName ? newField : f
        );
        return { ...t, fields: newFields };
      }
      return t;
    });
    // Si renombramos campo, hay que actualizar las relaciones que apuntan a ese campo
    const updatedRels = fullState.schema.relationships.map(
      (rel) => {
        if (
          rel.sourceTable === tableName &&
          rel.sourceField === oldFieldName
        ) {
          return { ...rel, sourceField: newField.name };
        }
        if (
          rel.targetTable === tableName &&
          rel.targetField === oldFieldName
        ) {
          return { ...rel, targetField: newField.name };
        }
        return rel;
      }
    );
    pushState({
      schema: {
        tables: updatedTables,
        relationships: updatedRels,
      },
      data: fullState.data,
    });
  };

  const removeField = (tableName: string, fieldName: string) => {
    if (!fullState) return;
    const updatedTables = fullState.schema.tables.map((t) => {
      if (t.name === tableName) {
        return {
          ...t,
          fields: t.fields.filter((f) => f.name !== fieldName),
        };
      }
      return t;
    });
    // También borramos relaciones que involucren a ese campo
    const updatedRels = fullState.schema.relationships.filter(
      (rel) =>
        !(
          (rel.sourceTable === tableName &&
            rel.sourceField === fieldName) ||
          (rel.targetTable === tableName &&
            rel.targetField === fieldName)
        )
    );
    // NOTA: No borramos filas de datos, eso sería manejado sólo en DataDef (más adelante)
    pushState({
      schema: {
        tables: updatedTables,
        relationships: updatedRels,
      },
      data: fullState.data,
    });
  };

  const addRelationship = (rel: Relationship) => {
    if (!fullState) return;
    // Evitamos duplicados exactos
    const exists = fullState.schema.relationships.find(
      (r) =>
        r.sourceTable === rel.sourceTable &&
        r.sourceField === rel.sourceField &&
        r.targetTable === rel.targetTable &&
        r.targetField === rel.targetField
    );
    if (exists) return;
    const newRels = [
      ...fullState.schema.relationships,
      rel,
    ];
    pushState({
      schema: {
        tables: fullState.schema.tables,
        relationships: newRels,
      },
      data: fullState.data,
    });
  };

  const removeRelationship = (relId: number) => {
    if (!fullState) return;
    const newRels = fullState.schema.relationships.filter(
      (_r, idx) => idx !== relId
    );
    pushState({
      schema: {
        tables: fullState.schema.tables,
        relationships: newRels,
      },
      data: fullState.data,
    });
  };

  // ——— Operaciones sobre los datos (filas) —————————————————————

  const addRow = (tableName: string, row: RowData) => {
    if (!fullState) return;
    // Asegurarse de que la tabla existe
    if (
      !fullState.schema.tables.find((t) => t.name === tableName)
    )
      return;
    const prevRows = fullState.data[tableName] || [];
    const newRows = [...prevRows, row];
    const newData: DataDef = {
      ...fullState.data,
      [tableName]: newRows,
    };
    pushState({
      schema: fullState.schema,
      data: newData,
    });
  };

  const updateRow = (
    tableName: string,
    rowIndex: number,
    newRow: RowData
  ) => {
    if (!fullState) return;
    if (!fullState.data[tableName]) return;
    const prevRows = fullState.data[tableName];
    if (rowIndex < 0 || rowIndex >= prevRows.length) return;
    const newRows = [...prevRows];
    newRows[rowIndex] = newRow;
    const newData: DataDef = {
      ...fullState.data,
      [tableName]: newRows,
    };
    pushState({
      schema: fullState.schema,
      data: newData,
    });
  };

  const removeRow = (tableName: string, rowIndex: number) => {
    if (!fullState) return;
    if (!fullState.data[tableName]) return;
    const prevRows = fullState.data[tableName];
    if (rowIndex < 0 || rowIndex >= prevRows.length) return;
    const newRows = prevRows.filter((_, idx) => idx !== rowIndex);
    const newData: DataDef = {
      ...fullState.data,
      [tableName]: newRows,
    };
    pushState({
      schema: fullState.schema,
      data: newData,
    });
  };

  // ——— Providencia todos los valores y funciones —————————————————————

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
  };

  return (
    <SchemaContext.Provider value={value}>
      {children}
    </SchemaContext.Provider>
  );
};

// Hook para usar más cómodo
export function useSchema() {
  const ctx = useContext(SchemaContext);
  if (!ctx) {
    throw new Error(
      "useSchema debe usarse dentro de <SchemaProvider>"
    );
  }
  return ctx;
}
