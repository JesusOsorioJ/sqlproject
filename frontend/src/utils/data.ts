import type { RowData, SchemaDef } from "../contexts/SchemaContext";

/**
   * Construye el prompt completo que se le envía a consultaIA.
   * Incluye:
   *  - Instrucciones explícitas del JSON esperado (ahora con "schema" y "data").
   *  - Regla de “hasta 5 intentos”.
   *  - El propio texto que el usuario escribió.
   */
export function buildSchemaWithDataPrompt(userDescription: string): string {
  return `
Por favor, genera únicamente un objeto JSON con la siguiente estructura EXACTA (sin ningún texto adicional, sin explicaciones, solo el objeto JSON):

{
  "schema": {
    "tables": [
      {
        "name": "NombreTabla1",
        "fields": [
          { "name": "campo1", "type": "TIPO1", "required": true|false },
          { "name": "campo2", "type": "TIPO2", "required": true|false }
        ]
      },
      {
        "name": "NombreTabla2",
        "fields": [
          { "name": "campoX", "type": "TIPOX", "required": true|false }
        ]
      }
      // … cualquier otra tabla necesaria
    ],
    "relationships": [
      {
        "sourceTable": "TablaOrigen",
        "sourceField": "campo_origen",
        "targetTable": "TablaDestino",
        "targetField": "campo_destino",
        "cardinality": "1:1"|"1:N"|"N:1"|"N:N"
      }
      // … cualquier otra relación necesaria
    ]
  },
  "data": {
    "NombreTabla1": [
      { "campo1": valor1, "campo2": valor2 /* , … */ }
      // … más objetos de ejemplo
    ],
    "NombreTabla2": [
      { "campoX": valorX /* , … */ }
    ]
    // … datos de ejemplo para cada tabla definida en "schema.tables"
  }
}

Reglas:

1. El JSON debe tener obligatoriamente las claves "schema" y "data", con esa ortografía exacta.  
2. Dentro de "schema", la clave "tables" es un arreglo de objetos con:
   - name (string)  
   - fields: un array de objetos con { name: string, type: string, required: boolean }  
3. Dentro de "schema", la clave "relationships" es un arreglo de objetos con:
   - sourceTable, sourceField, targetTable, targetField (todos strings)  
   - cardinality: solo puede ser "1:1", "1:N", "N:1" o "N:N"  
4. Dentro de "data", debe haber una clave por cada tabla listada en "schema.tables".  
   - Cada clave es el nombre de la tabla.  
   - El valor es un arreglo de objetos, donde cada objeto tiene pares { nombreCampo: valor } para todos los campos de esa tabla.  
   - Por ejemplo, si una tabla se llama "Usuarios" y sus fields incluyen { name: "id", type: "INT", required: true }, entonces cada objeto de "Usuarios" debe tener "id": algún_valor_número.  
   - Puedes usar valores de ejemplo realistas: cadenas para VARCHAR, números para INT, fechas en formato "YYYY-MM-DD" para DATE, etc.  
5. No incluyas ningún comentario, texto narrativo o explicación fuera del JSON.  
6. Si tu primera respuesta no cumple esta estructura EXACTA, debes intentarlo de nuevo (hasta 5 veces en total).  
7. Si después de 5 intentos sigues sin generar un JSON con el formato correcto, devuelve exactamente (sin comillas ni texto extra):  
   Error: no fue posible generar el esquema en el formato requerido tras 5 intentos.

Ahora, dado este requerimiento de negocio:
"${userDescription}"
genera las tablas, relaciones y datos de ejemplo para ese modelo de negocio. Solo responde con el objeto JSON que cumpla las reglas anteriores.
  `.trim();
}

/**
  * Valida que obj.schema tenga la forma de SchemaDef:
  * {
  *   tables: [ { name: string, fields: [ { name: string, type: string, required: boolean } ] } ],
  *   relationships: [ { sourceTable, sourceField, targetTable, targetField, cardinality } ]
  * }
  */
export function isValidSchema(obj: any): obj is SchemaDef {
  if (
    typeof obj !== "object" ||
    obj === null ||
    typeof obj.schema !== "object" ||
    obj.schema === null ||
    !Array.isArray(obj.schema.tables) ||
    !Array.isArray(obj.schema.relationships)
  ) {
    return false;
  }

  // Validar cada tabla
  for (const t of obj.schema.tables) {
    if (
      typeof t !== "object" ||
      t === null ||
      typeof t.name !== "string" ||
      !Array.isArray(t.fields)
    ) {
      return false;
    }
    for (const f of t.fields) {
      if (
        typeof f !== "object" ||
        f === null ||
        typeof f.name !== "string" ||
        typeof f.type !== "string" ||
        typeof f.required !== "boolean"
      ) {
        return false;
      }
    }
  }

  // Validar cada relación
  for (const r of obj.schema.relationships) {
    if (
      typeof r !== "object" ||
      r === null ||
      typeof r.sourceTable !== "string" ||
      typeof r.sourceField !== "string" ||
      typeof r.targetTable !== "string" ||
      typeof r.targetField !== "string" ||
      typeof r.cardinality !== "string"
    ) {
      return false;
    }
    const allowedCards = ["1:1", "1:N", "N:1", "N:N"];
    if (!allowedCards.includes(r.cardinality)) {
      return false;
    }
  }

  return true;
}


/**
 * Valida que obj.data sea un objeto que contenga, para cada tabla definida en schema, un arreglo de filas.
 * Además, comprueba que cada fila tenga al menos las llaves de los campos requeridos para esa tabla.
 */
export function isValidData(obj: any, schema: SchemaDef): boolean {
  if (typeof obj !== "object" || obj === null || typeof obj.data !== "object" || obj.data === null) {
    return false;
  }

  // Para cada tabla en el esquema, debe haber data[tableName] que sea un arreglo
  for (const t of schema.tables) {
    if (!Array.isArray(obj.data[t.name])) {
      return false;
    }
    // Verificamos cada fila para esta tabla
    for (const fila of obj.data[t.name]) {
      if (typeof fila !== "object" || fila === null) {
        return false;
      }
      // Asegurarnos de que los campos 'required: true' estén presentes
      for (const campo of t.fields) {
        if (campo.required && !(campo.name in fila)) {
          return false;
        }
      }
      // Nota: no validamos tipos exactos (ej. INT vs string), solo presencia de llave
    }
  }

  return true;
}


/**
 * Construye el prompt que se envía a la IA (será tu BACK)
 * Incluye:
 *  - La estructura completa de la base de datos convertida a JSON.
 *  - Que se genere única y exclusivamente la consulta SQL, sin texto adicional.
 *  - El texto en lenguaje natural (naturalText).
 *  - La regla de “intentar hasta 5 veces” y, si falla, devolver error fijo.
 */
export function buildSQLPrompt(
  schemaObject: SchemaDef,
  tableName: string,
  naturalText: string
): string {
  const schemaJSON = JSON.stringify(schemaObject, null, 2);
  return `
Dada la siguiente estructura de base de datos en formato JSON (solo esquema de tablas y relaciones):

${schemaJSON}

Genera únicamente la consulta SQL válida para la siguiente petición en lenguaje natural:
"${naturalText}"

La tabla principal que se consulta es "${tableName}".  
– Tu respuesta debe ser solamente la cadena SQL, sin texto adicional ni explicaciones.  
– Si tu primera respuesta no es un SQL válido (que comience con SELECT y contenga el nombre de la tabla), inténtalo de nuevo hasta 5 veces.  
– Si después de 5 intentos aún no generas un SQL válido, responde exactamente (sin comillas ni texto extra):
Error: no fue posible generar una consulta SQL válida tras 5 intentos.
    `.trim();
}

/**
* Valida de forma básica si el SQL generado es “válido”:
* - Empieza con SELECT (ignorando mayúsculas/minúsculas y espacios iniciales)
* - Contiene el nombre de la tabla en alguna parte
*/
export function isValidSQL(sql: string, tableName: string): boolean {
  if (typeof sql !== "string") return false;
  const trimmed = sql.trim().toLowerCase();
  if (!trimmed.startsWith("select")) return false;
  // Verificamos que aparezca la tabla (ignorando mayúsculas)
  if (!trimmed.includes(tableName.toLowerCase())) return false;
  return true;
}


/**
 * Array de 10 pares: { paragraph: string; schema: SchemaDef; data: Record<string, RowData[]> }
 * Cada elemento define un párrafo de “Probar suerte”, su esquema de tablas y sus registros de ejemplo.
 */
export const examples: {
  paragraph: string;
  schema: SchemaDef;
  data: Record<string, RowData[]>;
}[] = [
    {
      paragraph:
        "Un sistema de biblioteca en línea que permita a los usuarios buscar libros, registrarse, tomar prestados libros y devolverlos. Debe incluir tablas de Usuarios, Libros, Préstamos y Autores, con relaciones adecuadas entre ellos.",
      schema: {
        tables: [
          {
            name: "Usuarios",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "email", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Autores",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Libros",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "titulo", type: "VARCHAR(200)", required: true },
              { name: "autor_id", type: "INT", required: true },
              { name: "disponible", type: "VARCHAR(5)", required: true },
            ],
          },
          {
            name: "Prestamos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "usuario_id", type: "INT", required: true },
              { name: "libro_id", type: "INT", required: true },
              { name: "fecha_prestamo", type: "DATE", required: true },
              { name: "fecha_devolucion", type: "DATE", required: false },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Libros",
            sourceField: "autor_id",
            targetTable: "Autores",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Prestamos",
            sourceField: "usuario_id",
            targetTable: "Usuarios",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Prestamos",
            sourceField: "libro_id",
            targetTable: "Libros",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Usuarios: [
          { id: 1, nombre: "María López", email: "maria.lopez@example.com" },
          { id: 2, nombre: "Carlos Pérez", email: "carlos.perez@example.com" },
        ],
        Autores: [
          { id: 10, nombre: "Gabriel García Márquez" },
          { id: 11, nombre: "Isabel Allende" },
        ],
        Libros: [
          { id: 100, titulo: "Cien años de soledad", autor_id: 10, disponible: "sí" },
          { id: 101, titulo: "La casa de los espíritus", autor_id: 11, disponible: "no" },
        ],
        Prestamos: [
          {
            id: 1000,
            usuario_id: 1,
            libro_id: 100,
            fecha_prestamo: "2025-05-10",
            fecha_devolucion: null,
          },
        ],
      },
    },

    {
      paragraph:
        "Una aplicación de gestión de películas donde se registran Películas, Actores, Directores y Géneros. Cada película puede tener varios actores y géneros. Incluye tablas de Usuarios para valorar películas y tabla de Calificaciones.",
      schema: {
        tables: [
          {
            name: "Peliculas",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "titulo", type: "VARCHAR(200)", required: true },
              { name: "director_id", type: "INT", required: true },
              { name: "estreno", type: "DATE", required: true },
            ],
          },
          {
            name: "Actores",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Directores",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Generos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(50)", required: true },
            ],
          },
          {
            name: "UsuarioValoracion",
            fields: [
              { name: "usuario_id", type: "INT", required: true },
              { name: "pelicula_id", type: "INT", required: true },
              { name: "puntuacion", type: "INT", required: true },
              { name: "comentario", type: "VARCHAR(300)", required: false },
            ],
          },
          {
            name: "Usuarios",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Peliculas",
            sourceField: "director_id",
            targetTable: "Directores",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "UsuarioValoracion",
            sourceField: "usuario_id",
            targetTable: "Usuarios",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "UsuarioValoracion",
            sourceField: "pelicula_id",
            targetTable: "Peliculas",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Peliculas: [
          {
            id: 200,
            titulo: "La gran aventura",
            director_id: 20,
            estreno: "2025-03-15",
          },
          {
            id: 201,
            titulo: "Mi vida en rojo",
            director_id: 21,
            estreno: "2024-11-22",
          },
        ],
        Actores: [
          { id: 30, nombre: "Ana Torres" },
          { id: 31, nombre: "Pedro Ruiz" },
        ],
        Directores: [
          { id: 20, nombre: "Luis Gómez" },
          { id: 21, nombre: "Elena Rojas" },
        ],
        Generos: [
          { id: 40, nombre: "Acción" },
          { id: 41, nombre: "Drama" },
        ],
        Usuarios: [
          { id: 1, nombre: "Luisa Martínez" },
          { id: 2, nombre: "David Sánchez" },
        ],
        UsuarioValoracion: [
          {
            usuario_id: 1,
            pelicula_id: 200,
            puntuacion: 8,
            comentario: "Muy entretenida",
          },
        ],
      },
    },

    {
      paragraph:
        "Una plataforma de e-learning donde hay tablas de Estudiantes, Cursos, Profesores y Matrículas. Los estudiantes se inscriben en varios cursos y cada curso puede tener uno o más profesores asignados.",
      schema: {
        tables: [
          {
            name: "Estudiantes",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "email", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Profesores",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "especialidad", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Cursos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "titulo", type: "VARCHAR(200)", required: true },
              { name: "profesor_id", type: "INT", required: true },
            ],
          },
          {
            name: "Matriculas",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "estudiante_id", type: "INT", required: true },
              { name: "curso_id", type: "INT", required: true },
              { name: "fecha_matricula", type: "DATE", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Cursos",
            sourceField: "profesor_id",
            targetTable: "Profesores",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Matriculas",
            sourceField: "estudiante_id",
            targetTable: "Estudiantes",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Matriculas",
            sourceField: "curso_id",
            targetTable: "Cursos",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Estudiantes: [
          { id: 1, nombre: "Sara Díaz", email: "sara.diaz@example.com" },
          { id: 2, nombre: "Mario López", email: "mario.lopez@example.com" },
        ],
        Profesores: [
          { id: 10, nombre: "Laura Gómez", especialidad: "Matemáticas" },
          { id: 11, nombre: "José Silva", especialidad: "Historia" },
        ],
        Cursos: [
          { id: 100, titulo: "Álgebra I", profesor_id: 10 },
          { id: 101, titulo: "Historia Mundial", profesor_id: 11 },
        ],
        Matriculas: [
          { id: 1000, estudiante_id: 1, curso_id: 100, fecha_matricula: "2025-04-20" },
        ],
      },
    },

    {
      paragraph:
        "Un sistema de ventas para una tienda física con tablas de Productos, Clientes, Ventas y DetallesVenta. Cada venta puede incluir varios productos con cantidad y precio, y se relaciona con un cliente.",
      schema: {
        tables: [
          {
            name: "Productos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "precio", type: "REAL", required: true },
              { name: "stock", type: "INT", required: true },
            ],
          },
          {
            name: "Clientes",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "telefono", type: "VARCHAR(20)", required: false },
            ],
          },
          {
            name: "Ventas",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "cliente_id", type: "INT", required: true },
              { name: "fecha", type: "DATE", required: true },
              { name: "total", type: "REAL", required: true },
            ],
          },
          {
            name: "DetalleVenta",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "venta_id", type: "INT", required: true },
              { name: "producto_id", type: "INT", required: true },
              { name: "cantidad", type: "INT", required: true },
              { name: "sub_total", type: "REAL", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Ventas",
            sourceField: "cliente_id",
            targetTable: "Clientes",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "DetalleVenta",
            sourceField: "venta_id",
            targetTable: "Ventas",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "DetalleVenta",
            sourceField: "producto_id",
            targetTable: "Productos",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Productos: [
          { id: 1, nombre: "Lapicero Azul", precio: 1.5, stock: 100 },
          { id: 2, nombre: "Cuaderno A4", precio: 2.75, stock: 50 },
        ],
        Clientes: [
          { id: 10, nombre: "Lucía Fernández", telefono: "555-1234" },
          { id: 11, nombre: "Pedro Martín", telefono: "555-5678" },
        ],
        Ventas: [
          { id: 100, cliente_id: 10, fecha: "2025-05-12", total: 5.25 },
        ],
        DetalleVenta: [
          { id: 1000, venta_id: 100, producto_id: 1, cantidad: 2, sub_total: 3.0 },
          { id: 1001, venta_id: 100, producto_id: 2, cantidad: 1, sub_total: 2.75 },
        ],
      },
    },


    {
      paragraph:
        "Un CRM (Customer Relationship Management) sencillo donde se almacenan Clientes, Oportunidades, Contactos y Actividades. Cada oportunidad está asociada a un cliente y cada actividad se asigna a un contacto específico.",
      schema: {
        tables: [
          {
            name: "Clientes",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "email", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Oportunidades",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "cliente_id", type: "INT", required: true },
              { name: "descripcion", type: "VARCHAR(200)", required: true },
              { name: "valor", type: "REAL", required: true },
            ],
          },
          {
            name: "Contactos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "cliente_id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "telefono", type: "VARCHAR(20)", required: false },
            ],
          },
          {
            name: "Actividades",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "contacto_id", type: "INT", required: true },
              { name: "tipo", type: "VARCHAR(50)", required: true },
              { name: "fecha", type: "DATE", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Oportunidades",
            sourceField: "cliente_id",
            targetTable: "Clientes",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Contactos",
            sourceField: "cliente_id",
            targetTable: "Clientes",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Actividades",
            sourceField: "contacto_id",
            targetTable: "Contactos",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Clientes: [
          { id: 1, nombre: "Empresa X", email: "info@empresax.com" },
          { id: 2, nombre: "Negocios Y", email: "contacto@negociosy.com" },
        ],
        Oportunidades: [
          {
            id: 100,
            cliente_id: 1,
            descripcion: "Venta de software",
            valor: 15000.0,
          },
        ],
        Contactos: [
          {
            id: 10,
            cliente_id: 1,
            nombre: "Laura Castillo",
            telefono: "555-9876",
          },
        ],
        Actividades: [
          {
            id: 1000,
            contacto_id: 10,
            tipo: "Llamada",
            fecha: "2025-04-28",
          },
        ],
      },
    },

    {
      paragraph:
        "Una plataforma de reservas de hoteles con tablas de Hoteles, Habitaciones, Reservas y Clientes. Cada reserva vincula a un cliente con una habitación concreta para un rango de fechas.",
      schema: {
        tables: [
          {
            name: "Hoteles",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "ciudad", type: "VARCHAR(50)", required: true },
            ],
          },
          {
            name: "Habitaciones",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "hotel_id", type: "INT", required: true },
              { name: "numero", type: "INT", required: true },
              { name: "precio_noche", type: "REAL", required: true },
            ],
          },
          {
            name: "Clientes",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "telefono", type: "VARCHAR(20)", required: false },
            ],
          },
          {
            name: "Reservas",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "cliente_id", type: "INT", required: true },
              { name: "habitacion_id", type: "INT", required: true },
              { name: "fecha_inicio", type: "DATE", required: true },
              { name: "fecha_fin", type: "DATE", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Habitaciones",
            sourceField: "hotel_id",
            targetTable: "Hoteles",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Reservas",
            sourceField: "cliente_id",
            targetTable: "Clientes",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Reservas",
            sourceField: "habitacion_id",
            targetTable: "Habitaciones",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Hoteles: [
          { id: 1, nombre: "Hotel Central", ciudad: "Bogotá" },
          { id: 2, nombre: "Playa Paraíso", ciudad: "Cartagena" },
        ],
        Habitaciones: [
          { id: 10, hotel_id: 1, numero: 101, precio_noche: 120.0 },
          { id: 11, hotel_id: 1, numero: 102, precio_noche: 150.0 },
        ],
        Clientes: [
          { id: 100, nombre: "Luis Herrera", telefono: "300-1234567" },
        ],
        Reservas: [
          {
            id: 1000,
            cliente_id: 100,
            habitacion_id: 10,
            fecha_inicio: "2025-06-01",
            fecha_fin: "2025-06-05",
          },
        ],
      },
    },

    {
      paragraph:
        "Un sistema de control de inventario con tablas de Productos, Categorías, Proveedores e Inventarios. Cada producto pertenece a una categoría y cada inventario registra existencias por proveedor.",
      schema: {
        tables: [
          {
            name: "Categorias",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Proveedores",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "telefono", type: "VARCHAR(20)", required: false },
            ],
          },
          {
            name: "Productos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "categoria_id", type: "INT", required: true },
              { name: "precio", type: "REAL", required: true },
            ],
          },
          {
            name: "Inventarios",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "producto_id", type: "INT", required: true },
              { name: "proveedor_id", type: "INT", required: true },
              { name: "cantidad", type: "INT", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Productos",
            sourceField: "categoria_id",
            targetTable: "Categorias",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Inventarios",
            sourceField: "producto_id",
            targetTable: "Productos",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Inventarios",
            sourceField: "proveedor_id",
            targetTable: "Proveedores",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Categorias: [
          { id: 1, nombre: "Electrónica" },
          { id: 2, nombre: "Ropa" },
        ],
        Proveedores: [
          { id: 10, nombre: "Global Suministros", telefono: "311-6543210" },
        ],
        Productos: [
          { id: 100, nombre: "Smartphone A1", categoria_id: 1, precio: 299.99 },
        ],
        Inventarios: [
          { id: 1000, producto_id: 100, proveedor_id: 10, cantidad: 200 },
        ],
      },
    },

    {
      paragraph:
        "Una aplicación de seguimiento de proyectos con tablas de Proyectos, Tareas, Usuarios y Colaboradores. Cada proyecto puede tener múltiples tareas y cada tarea puede tener asignados varios colaboradores.",
      schema: {
        tables: [
          {
            name: "Usuarios",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "email", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Proyectos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "titulo", type: "VARCHAR(200)", required: true },
              { name: "fecha_inicio", type: "DATE", required: true },
              { name: "fecha_fin", type: "DATE", required: false },
            ],
          },
          {
            name: "Tareas",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "proyecto_id", type: "INT", required: true },
              { name: "descripcion", type: "VARCHAR(200)", required: true },
              { name: "estado", type: "VARCHAR(20)", required: true },
            ],
          },
          {
            name: "Colaboradores",
            fields: [
              { name: "tarea_id", type: "INT", required: true },
              { name: "usuario_id", type: "INT", required: true },
              { name: "rol", type: "VARCHAR(50)", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "Tareas",
            sourceField: "proyecto_id",
            targetTable: "Proyectos",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Colaboradores",
            sourceField: "tarea_id",
            targetTable: "Tareas",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Colaboradores",
            sourceField: "usuario_id",
            targetTable: "Usuarios",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Usuarios: [
          { id: 1, nombre: "Jorge Díaz", email: "jorge.diaz@example.com" },
        ],
        Proyectos: [
          {
            id: 100,
            titulo: "Desarrollo App Móvil",
            fecha_inicio: "2025-04-01",
            fecha_fin: "2025-09-30",
          },
        ],
        Tareas: [
          {
            id: 1000,
            proyecto_id: 100,
            descripcion: "Diseño UI",
            estado: "En progreso",
          },
        ],
        Colaboradores: [
          {
            tarea_id: 1000,
            usuario_id: 1,
            rol: "Diseñador",
          },
        ],
      },
    },

    {
      paragraph:
        "Un portal de empleo donde existen tablas de Empleadores, Candidatos, OfertasTrabajo y Postulaciones. Los candidatos pueden postular a varias ofertas y cada oferta pertenece a un solo empleador.",
      schema: {
        tables: [
          {
            name: "Empleadores",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "empresa", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "Candidatos",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "nombre", type: "VARCHAR(100)", required: true },
              { name: "email", type: "VARCHAR(100)", required: true },
            ],
          },
          {
            name: "OfertasTrabajo",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "titulo", type: "VARCHAR(200)", required: true },
              { name: "empleador_id", type: "INT", required: true },
              { name: "salario", type: "REAL", required: true },
            ],
          },
          {
            name: "Postulaciones",
            fields: [
              { name: "id", type: "INT", required: true },
              { name: "candidato_id", type: "INT", required: true },
              { name: "oferta_id", type: "INT", required: true },
              { name: "fecha_postulacion", type: "DATE", required: true },
            ],
          },
        ],
        relationships: [
          {
            sourceTable: "OfertasTrabajo",
            sourceField: "empleador_id",
            targetTable: "Empleadores",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Postulaciones",
            sourceField: "candidato_id",
            targetTable: "Candidatos",
            targetField: "id",
            cardinality: "N:1",
          },
          {
            sourceTable: "Postulaciones",
            sourceField: "oferta_id",
            targetTable: "OfertasTrabajo",
            targetField: "id",
            cardinality: "N:1",
          },
        ],
      },
      data: {
        Empleadores: [
          { id: 1, empresa: "TechCorp" },
          { id: 2, empresa: "InnovaSoft" },
        ],
        Candidatos: [
          { id: 10, nombre: "Ana Rivas", email: "ana.rivas@example.com" },
          { id: 11, nombre: "Luis Mejía", email: "luis.mejia@example.com" },
        ],
        OfertasTrabajo: [
          { id: 100, titulo: "Desarrollador Frontend", empleador_id: 1, salario: 55000.0 },
        ],
        Postulaciones: [
          {
            id: 1000,
            candidato_id: 10,
            oferta_id: 100,
            fecha_postulacion: "2025-05-05",
          },
        ],
      },

    }
  ]



