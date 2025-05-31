// src/components/TablePropertiesEditor.tsx
import React, { useState, useEffect } from "react";
import {
  useSchema,
  TableDef,
  FieldDef,
  Relationship,
} from "../contexts/SchemaContext";

interface Props {
  tableName: string;
}

const TablePropertiesEditor: React.FC<Props> = ({
  tableName,
}) => {
  const {
    fullState,
    renameTable,
    removeTable,
    addField,
    updateField,
    removeField,
    addRelationship,
    removeRelationship,
  } = useSchema();

  const [localTableName, setLocalTableName] =
    useState<string>(tableName);
  const [renameError, setRenameError] = useState<string | null>(
    null
  );

  // Cada vez que tableName cambie (por si el padre lo modifica), actualizamos el input
  useEffect(() => {
    setLocalTableName(tableName);
  }, [tableName]);

  if (!fullState) return null;

  const table: TableDef | undefined =
    fullState.schema.tables.find((t) => t.name === tableName);

  if (!table) {
    return (
      <div>
        <p className="text-red-600">
          La tabla “{tableName}” no existe.
        </p>
      </div>
    );
  }

  // ——— Renombrar tabla —————————————————————
  const handleRename = () => {
    setRenameError(null);
    const newName = localTableName.trim();
    if (!newName) {
      setRenameError("El nombre no puede estar vacío.");
      return;
    }
    if (newName === tableName) {
      return; // no cambia nada
    }
    // Buscar si ya existe una tabla con ese nombre
    if (
      fullState.schema.tables.find((t) => t.name === newName)
    ) {
      setRenameError("Ya existe una tabla con ese nombre.");
      return;
    }
    renameTable(tableName, newName);
  };

  // ——— Eliminar tabla (con confirmación) —————————————————————
  const handleDeleteTable = () => {
    if (
      window.confirm(
        `¿Seguro que deseas eliminar la tabla “${tableName}”?`
      )
    ) {
      removeTable(tableName);
    }
  };

  // ——— Campos (fields) —————————————————————
  // Estado local para formulario de NUEVO campo
  const [newFieldName, setNewFieldName] = useState<string>("");
  const [newFieldType, setNewFieldType] = useState<string>(
    "VARCHAR(100)"
  );
  const [newFieldRequired, setNewFieldRequired] =
    useState<boolean>(false);
  const [fieldError, setFieldError] = useState<string | null>(
    null
  );

  const handleAddField = () => {
    setFieldError(null);
    const name = newFieldName.trim();
    if (!name) {
      setFieldError("El nombre del campo no puede estar vacío.");
      return;
    }
    if (table.fields.find((f) => f.name === name)) {
      setFieldError("Ya existe un campo con ese nombre.");
      return;
    }
    addField(tableName, {
      name,
      type: newFieldType,
      required: newFieldRequired,
    });
    setNewFieldName("");
    setNewFieldRequired(false);
    setNewFieldType("VARCHAR(100)");
  };

  // Para editar un campo en línea, podríamos usar un estado local por cada campo…
  // Para simplificar, creamos un mini estado temporal:
  const [editingFieldIdx, setEditingFieldIdx] =
    useState<number | null>(null);
  const [editFieldName, setEditFieldName] =
    useState<string>("");

  const startEditingField = (idx: number, f: FieldDef) => {
    setEditingFieldIdx(idx);
    setEditFieldName(f.name);
  };

  const saveEditingField = (idx: number) => {
    if (editingFieldIdx === null) return;
    const oldName = table.fields[idx].name;
    const newNameTrim = editFieldName.trim();
    if (!newNameTrim) return;
    if (
      newNameTrim !== oldName &&
      table.fields.find((f) => f.name === newNameTrim)
    ) {
      return; // no aceptar duplicados
    }
    updateField(tableName, oldName, {
      ...table.fields[idx],
      name: newNameTrim,
    });
    setEditingFieldIdx(null);
    setEditFieldName("");
  };

  // ——— Relaciones —————————————————————
  // Estado local para crear NUEVA relación
  const [relSourceField, setRelSourceField] =
    useState<string>("");
  const [relTargetTable, setRelTargetTable] =
    useState<string>("");
  const [relTargetField, setRelTargetField] =
    useState<string>("");
  const [relError, setRelError] = useState<string | null>(
    null
  );

  const handleAddRelationship = () => {
    setRelError(null);
    if (!relSourceField) {
      setRelError("Selecciona un campo de esta tabla.");
      return;
    }
    if (!relTargetTable) {
      setRelError("Selecciona la tabla destino.");
      return;
    }
    if (!relTargetField) {
      setRelError("Selecciona el campo destino.");
      return;
    }
    // Evita crear relación con sí misma
    if (relTargetTable === tableName) {
      setRelError("La tabla destino no puede ser la misma.");
      return;
    }
    // Verificar que no existe ya
    const exists = fullState.schema.relationships.find(
      (r) =>
        r.sourceTable === tableName &&
        r.sourceField === relSourceField &&
        r.targetTable === relTargetTable &&
        r.targetField === relTargetField
    );
    if (exists) {
      setRelError("Esa relación ya existe.");
      return;
    }
    addRelationship({
      sourceTable: tableName,
      sourceField: relSourceField,
      targetTable: relTargetTable,
      targetField: relTargetField,
    });
    // Limpiar formulario
    setRelSourceField("");
    setRelTargetTable("");
    setRelTargetField("");
  };

  // Obtener solo las tablas disponibles para “tabla destino”
  const otherTables = fullState.schema.tables.filter(
    (t) => t.name !== tableName
  );

  // ——— Render del componente —————————————————————

  return (
    <div className="p-4 space-y-4">
      {/* —— Sección 1: Renombrar / Eliminar Tabla —— */}
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">
          Propiedades de tabla
        </h3>
        <div className="flex items-center space-x-2 mt-2">
          <input
            className="border px-2 py-1 rounded flex-1"
            value={localTableName}
            onChange={(e) =>
              setLocalTableName(e.target.value)
            }
          />
          <button
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={handleRename}
          >
            Renombrar
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handleDeleteTable}
          >
            Eliminar
          </button>
        </div>
        {renameError && (
          <p className="text-red-600 text-sm mt-1">
            {renameError}
          </p>
        )}
      </div>

      {/* —— Sección 2: Campos de la tabla —— */}
      <div className="border-b pb-2 space-y-2">
        <h4 className="text-md font-semibold">Campos</h4>

        {table.fields.length === 0 && (
          <p className="italic text-gray-500">
            Aún no hay campos.
          </p>
        )}

        {table.fields.map((f, idx) => (
          <div
            key={f.name}
            className="flex items-center justify-between"
          >
            {editingFieldIdx === idx ? (
              <>
                <input
                  className="border px-2 py-1 rounded flex-1 mr-2"
                  value={editFieldName}
                  onChange={(e) =>
                    setEditFieldName(e.target.value)
                  }
                />
                <button
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                  onClick={() => saveEditingField(idx)}
                >
                  Guardar
                </button>
                <button
                  className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                  onClick={() =>
                    setEditingFieldIdx(null)
                  }
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="font-medium">
                    {f.name}
                  </span>{" "}
                  <span className="text-xs text-gray-500">
                    ({f.type}
                    {f.required ? ", requerido" : ", opcional"})
                  </span>
                </div>
                <div className="space-x-1">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    onClick={() => startEditingField(idx, f)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() =>
                      removeField(tableName, f.name)
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Formulario para NUEVO campo */}
        <div className="mt-4">
          <h5 className="font-semibold">
            Agregar nuevo campo
          </h5>
          <div className="space-y-2">
            <input
              className="w-full border px-2 py-1 rounded"
              placeholder="Nombre del campo"
              value={newFieldName}
              onChange={(e) =>
                setNewFieldName(e.target.value)
              }
            />
            <div className="flex items-center space-x-2">
              <select
                className="border px-2 py-1 rounded flex-1"
                value={newFieldType}
                onChange={(e) =>
                  setNewFieldType(e.target.value)
                }
              >
                {/* Aquí puedes listar más tipos si quieres */}
                <option value="INT">INT</option>
                <option value="REAL">REAL</option>
                <option value="VARCHAR(100)">
                  VARCHAR(100)
                </option>
                <option value="DATE">DATE</option>
              </select>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) =>
                    setNewFieldRequired(e.target.checked)
                  }
                />
                <span className="text-sm">Requerido</span>
              </label>
            </div>
            <button
              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleAddField}
            >
              + Campo
            </button>
            {fieldError && (
              <p className="text-red-600 text-sm">
                {fieldError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* —— Sección 3: Relaciones —— */}
      <div className="space-y-2">
        <h4 className="text-md font-semibold">
          Relaciones
        </h4>
        {/* Listado de relaciones existentes donde esta tabla participa */}
        {fullState.schema.relationships
          .map((rel, idx) => ({ rel, idx }))
          .filter(
            ({ rel }) =>
              rel.sourceTable === tableName ||
              rel.targetTable === tableName
          )
          .map(({ rel, idx }) => {
            const isSource = rel.sourceTable === tableName;
            return (
              <div
                key={idx}
                className="flex items-center justify-between"
              >
                <span className="flex-1 text-sm">
                  {isSource ? (
                    <>
                      <strong>{rel.sourceField}</strong> →{" "}
                      {rel.targetTable}
                      .{rel.targetField}
                    </>
                  ) : (
                    <>
                      {rel.sourceTable}
                      .{rel.sourceField} →
                      <strong>
                        {rel.targetField}
                      </strong>
                    </>
                  )}
                </span>
                <button
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  onClick={() =>
                    removeRelationship(idx)
                  }
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        {fullState.schema.relationships.filter(
          (rel) =>
            rel.sourceTable === tableName ||
            rel.targetTable === tableName
        ).length === 0 && (
          <p className="italic text-gray-500">
            No hay relaciones para esta tabla.
          </p>
        )}

        {/* Formulario para NUEVA relación */}
        <div className="pt-4 border-t space-y-2">
          <h5 className="font-semibold">
            Agregar nueva relación
          </h5>
          <div className="space-y-2">
            {/* 1) Campo de origen (de esta tabla) */}
            <label className="text-sm font-medium">
              Campo en <strong>{tableName}</strong>
            </label>
            <select
              className="w-full border px-2 py-1 rounded"
              value={relSourceField}
              onChange={(e) =>
                setRelSourceField(e.target.value)
              }
            >
              <option value="">-- Selecciona campo --</option>
              {table.fields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* 2) Tabla destino */}
            <label className="text-sm font-medium">
              Tabla destino
            </label>
            <select
              className="w-full border px-2 py-1 rounded"
              value={relTargetTable}
              onChange={(e) => {
                setRelTargetTable(e.target.value);
                setRelTargetField(""); // limpio la selección de campo
              }}
            >
              <option value="">
                -- Selecciona tabla --
              </option>
              {fullState.schema.tables
                .filter((t) => t.name !== tableName)
                .map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
            </select>

            {/* 3) Campo destino (solo si hay tabla destino elegida) */}
            {relTargetTable && (
              <>
                <label className="text-sm font-medium">
                  Campo en{" "}
                  <strong>{relTargetTable}</strong>
                </label>
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={relTargetField}
                  onChange={(e) =>
                    setRelTargetField(e.target.value)
                  }
                >
                  <option value="">
                    -- Selecciona campo --
                  </option>
                  {fullState.schema.tables
                    .find((t) => t.name === relTargetTable)!
                    .fields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </>
            )}

            <button
              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleAddRelationship}
            >
              + Relación
            </button>
            {relError && (
              <p className="text-red-600 text-sm">
                {relError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePropertiesEditor;
