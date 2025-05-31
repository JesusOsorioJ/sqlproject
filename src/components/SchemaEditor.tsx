// src/components/SchemaEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { useSchema, type SchemaDef } from "../contexts/SchemaContext";

// Array de 10 párrafos de ejemplo para “Probar suerte”
const sampleParagraphs: string[] = [
  "Un sistema de biblioteca en línea que permita a los usuarios buscar libros, registrarse, tomar prestados libros y devolverlos. Debe incluir tablas de Usuarios, Libros, Préstamos y Autores, con relaciones adecuadas entre ellos.",
  "Una aplicación de gestión de películas donde se registran Películas, Actores, Directores y Géneros. Cada película puede tener varios actores y géneros. Incluye tablas de Usuarios para valorar películas y tabla de Calificaciones.",
  "Una plataforma de e-learning donde hay tablas de Estudiantes, Cursos, Profesores y Matrículas. Los estudiantes se inscriben en varios cursos y cada curso puede tener uno o más profesores asignados.",
  "Un sistema de ventas para una tienda física con tablas de Productos, Clientes, Ventas y DetallesVenta. Cada venta puede incluir varios productos con cantidad y precio, y se relaciona con un cliente.",
  "Un portal de empleo donde existen tablas de Empleadores, Candidatos, OfertasTrabajo y Postulaciones. Los candidatos pueden postular a varias ofertas y cada oferta pertenece a un solo empleador.",
  "Un CRM (Customer Relationship Management) sencillo donde se almacenan Clientes, Oportunidades, Contactos y Actividades. Cada oportunidad está asociada a un cliente y cada actividad se asigna a un contacto específico.",
  "Una plataforma de reservas de hoteles con tablas de Hoteles, Habitaciones, Reservas y Clientes. Cada reserva vincula a un cliente con una habitación concreta para un rango de fechas.",
  "Un sistema de control de inventario con tablas de Productos, Categorías, Proveedores e Inventarios. Cada producto pertenece a una categoría y cada inventario registra existencias por proveedor.",
  "Una aplicación de seguimiento de proyectos con tablas de Proyectos, Tareas, Usuarios y Colaboradores. Cada proyecto puede tener múltiples tareas y cada tarea puede tener asignados varios colaboradores.",
  "Una red social básica con tablas de Usuarios, Publicaciones, Comentarios y Seguidores. Cada publicación es creada por un usuario, puede tener varios comentarios, y los usuarios pueden seguirse entre sí."
];

// Mock de generación de esquema (simula llamada a IA)
const mockGenerateSchema = async (description: string): Promise<SchemaDef> => {
  // Si la descripción menciona "e-commerce", devolvemos un esquema de ejemplo
  if (description.toLowerCase().includes("e-commerce")) {
    const schema: SchemaDef = {
      tables: [
        {
          name: "Productos",
          fields: [
            { name: "id", type: "INT", required: true },
            { name: "nombre", type: "VARCHAR(100)", required: true },
            { name: "precio", type: "REAL", required: true },
            { name: "estado", type: "VARCHAR(20)", required: true },
          ],
        },
        {
          name: "Usuarios",
          fields: [
            { name: "id", type: "INT", required: true },
            { name: "email", type: "VARCHAR(100)", required: true },
            { name: "nombre", type: "VARCHAR(50)", required: true },
          ],
        },
        {
          name: "Ventas",
          fields: [
            { name: "id", type: "INT", required: true },
            { name: "usuario_id", type: "INT", required: true },
            { name: "producto_id", type: "INT", required: true },
            { name: "fecha", type: "DATE", required: true },
            { name: "cantidad", type: "INT", required: true },
          ],
        },
      ],
      relationships: [
        {
          sourceTable: "Ventas",
          sourceField: "usuario_id",
          targetTable: "Usuarios",
          targetField: "id",
          cardinality: "N:1",
        },
        {
          sourceTable: "Ventas",
          sourceField: "producto_id",
          targetTable: "Productos",
          targetField: "id",
          cardinality: "N:1",
        },
      ],
    };
    return new Promise((resolve) => setTimeout(() => resolve(schema), 500));
  } else {
    return Promise.reject(new Error("Mock IA: no se reconoció la descripción."));
  }
};

const SchemaEditor: React.FC = () => {
  const { setSchema, loading } = useSchema();
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingIntervalRef = useRef<number | null>(null);

  // Función para generar esquema a partir del texto actual o de override
  const handleGenerate = async (overrideText?: string) => {
    const description = overrideText !== undefined ? overrideText : text;
    setError(null);
    if (!description.trim()) {
      setError("Debe escribir una descripción.");
      return;
    }
    try {
      setError(null);
      const newSchema = await mockGenerateSchema(description.trim());
      setSchema(newSchema);
      // Aseguramos que el textarea contenga el texto final (timeout por si estaba tipeando)
      setText(description);
    } catch (e: any) {
      setError(e.message || "Error generando esquema.");
    }
  };

  // Función que simula el tipeo letra a letra y luego genera el esquema
  const handleRandom = () => {
    // Elegir un párrafo al azar
    const idx = Math.floor(Math.random() * sampleParagraphs.length);
    const sample = sampleParagraphs[idx];
    // Iniciar efecto typewriter
    setText("");
    setError(null);
    setIsTyping(true);

    let i = 0;
    // Limpiar cualquier intervalo anterior
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    // Intervalo para insertar una letra cada 50ms
    typingIntervalRef.current = window.setInterval(() => {
      setText((prev) => prev + sample[i-1]);
      i++;
      if (i === sample.length) {
        // Terminó de escribir
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
        // Esperamos 200ms antes de generar para que el usuario vea el texto completo
        setTimeout(() => {
          handleGenerate(sample);
        }, 200);
      }
    }, 20);
  };

  // Limpieza si el componente se desmonta mientras tipeamos
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <textarea
        className={`w-full h-24 p-2 border rounded focus:outline-none focus:ring ${
          isTyping ? "bg-gray-100" : ""
        }`}
        placeholder="Describe tu modelo de negocio…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isTyping || loading}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded text-white ${
            loading || isTyping
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={() => handleGenerate()}
          disabled={loading || isTyping}
        >
          {loading ? "Cargando..." : "Generar esquema"}
        </button>
        <button
          className={`px-4 py-2 rounded text-white ${
            loading || isTyping
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          onClick={handleRandom}
          disabled={loading || isTyping}
          title="Obtén una descripción de ejemplo al azar y genera el esquema con un efecto de tipeo"
        >
          {isTyping ? "Escribiendo..." : "Probar suerte"}
        </button>
      </div>
    </div>
  );
};

export default SchemaEditor;
