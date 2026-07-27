// ============================================================
// Regenera ÚNICAMENTE el 03_Diseno_Arquitectonico.docx
// Corregido: usa Supabase como BaaS (no Firebase)
// Stack real: React Native + React Native Web + Supabase
// ============================================================
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion\\propuestas';

const bold = (t, sz = 24) => new TextRun({ text: t, bold: true, font: 'Times New Roman', size: sz });
const norm = (t, sz = 24) => new TextRun({ text: t, font: 'Times New Roman', size: sz });
const ital = (t, sz = 24) => new TextRun({ text: t, italics: true, font: 'Times New Roman', size: sz });

const heading = (text, lvl = 1) => new Paragraph({
  heading: lvl === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
  spacing: { line: 480, lineRule: 'AUTO', before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: lvl === 1 ? 28 : 26 })]
});

const sub = (text) => heading(text, 2);

const para = (...runs) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 480, lineRule: 'AUTO', before: 0, after: 120 },
  children: runs.map(r => typeof r === 'string' ? norm(r) : r)
});

const bul = (text) => new Paragraph({
  bullet: { level: 0 },
  spacing: { line: 480, lineRule: 'AUTO', before: 0, after: 60 },
  alignment: AlignmentType.JUSTIFIED,
  children: [norm(text)]
});

const empty = () => new Paragraph({ spacing: { line: 480, lineRule: 'AUTO' }, children: [norm('')] });

const note = (text) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, lineRule: 'AUTO', before: 60, after: 120 },
  children: [ital('Nota. '), norm(text)]
});

async function save(doc, filename) {
  const buf = await Packer.toBuffer(doc);
  const out = path.join(OUT, filename);
  fs.writeFileSync(out, buf);
  console.log('✅ Generado:', filename, `(${Math.round(buf.length/1024)} KB)`);
}

async function crearArquitectura() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [

        // ─── Título principal ────────────────────────────────
        heading('3.3 Diseño Arquitectónico'),
        empty(),

        // ─── Intro: patrón Container/Components ─────────────
        para(
          'Le Chambea utiliza el patrón de arquitectura ',
          bold('Container/Components'),
          ', comúnmente empleado en aplicaciones desarrolladas con React y React Native. Este patrón permite una mejor separación de responsabilidades dentro del proyecto: los ',
          bold('Containers'),
          ' se encargan de manejar la lógica de negocio y el acceso a datos, mientras que los ',
          bold('Components'),
          ' se enfocan exclusivamente en la presentación visual de la interfaz de usuario. Esta separación hace que el código sea más limpio, reutilizable y fácil de mantener ',
          bold('(Bernal, 2024)'),
          '.'
        ),

        // ─── Intro: patrón MVC ───────────────────────────────
        para(
          'Adicionalmente, la arquitectura sigue el patrón ',
          bold('MVC (Model-View-Controller)'),
          ', el cual es comúnmente utilizado para implementar interfaces de usuario, datos y lógica de control. Este patrón enfatiza una mejor separación entre la lógica de negocio y su visualización, siendo ideal para proyectos de mediana y gran escala donde la arquitectura modular es esencial para manejar la complejidad y el crecimiento del sistema ',
          bold('(MDN Web Docs, s.f.; Prawira, 2025)'),
          '.'
        ),

        // ─── Descripción del stack real ──────────────────────
        para(
          'En Le Chambea, el ',
          bold('Modelo'),
          ' de datos es gestionado por ',
          bold('Supabase'),
          ' (PostgreSQL, Auth y Storage), la ',
          bold('Vista'),
          ' es implementada a través de los componentes de React Native y React Native Web, y el ',
          bold('Controlador'),
          ' es representado por los Context providers, hooks de estado y servicios de acceso a datos que intermedian la comunicación entre la capa de datos y la capa de presentación. La elección de Supabase como backend se debe a que proporciona una base de datos relacional PostgreSQL en tiempo real, autenticación de usuarios integrada, APIs RESTful automáticas y almacenamiento de archivos con acceso seguro, siendo una alternativa open source y escalable que se integra nativamente con React Native ',
          bold('(Supabase, 2024)'),
          '.'
        ),

        empty(),

        // ─── Nivel 0 ─────────────────────────────────────────
        sub('3.3.1 Diagrama de Componentes de Nivel 0'),
        empty(),

        para(
          'El diagrama de nivel 0 representa la vista macroscópica del sistema, mostrando los tres módulos principales que componen la arquitectura de Le Chambea y cómo se interrelacionan a nivel de sistema. Los módulos son: la capa de presentación con la aplicación móvil (React Native) y la aplicación web (React Native Web), y la capa de datos con ',
          bold('Supabase'),
          ' como servicio de backend.'
        ),

        empty(),
        para(bold('Módulo 1 – Supabase (Backend as a Service / BaaS)')),
        para(
          'Provee todos los servicios del backend de la aplicación: la base de datos relacional ',
          bold('PostgreSQL'),
          ' con sincronización en tiempo real (Realtime), el sistema de autenticación de usuarios (Supabase Auth con soporte para correo/contraseña y OAuth con Google), y el almacenamiento de archivos multimedia (Supabase Storage). Este módulo actúa como el servidor centralizado al que se conectan ambas interfaces de la aplicación mediante el SDK oficial de Supabase.'
        ),

        para(bold('Módulo 2 – Aplicación Móvil (React Native + Expo)')),
        para(
          'Interfaz de usuario para dispositivos Android e iOS, desarrollada con ',
          bold('React Native'),
          ' y gestionada con ',
          bold('Expo'),
          '. Consume los servicios de Supabase mediante el SDK oficial ',
          ital('(@supabase/supabase-js)'),
          ' y se comunica en tiempo real con la base de datos PostgreSQL para mostrar información actualizada al instante. La navegación interna de la app está gestionada por React Navigation.'
        ),

        para(bold('Módulo 3 – Aplicación Web (React Native Web)')),
        para(
          'Versión web de la aplicación, desarrollada con ',
          bold('React Native Web'),
          ', que comparte la misma base de código que la aplicación móvil, maximizando la reutilización de componentes y lógica de negocio. Accede igualmente a Supabase para autenticación y datos, y permite a los usuarios acceder a la plataforma desde cualquier navegador de escritorio o móvil sin necesidad de instalar la aplicación.'
        ),

        para(ital('[Insertar aquí el Diagrama de Componentes Nivel 0 – elaborado en Lucidchart o draw.io]')),
        note('Diagrama de componentes de nivel 0 mostrando los tres módulos principales del sistema Le Chambea y su interrelación con Supabase como capa de datos. Fuente propia, elaborado en Lucidchart.'),

        empty(),

        // ─── Nivel 1 ─────────────────────────────────────────
        sub('3.3.2 Diagrama de Componentes de Nivel 1'),
        empty(),

        para(
          'El diagrama de nivel 1 refleja los componentes y las relaciones de cada módulo de la aplicación, definiendo los subcomponentes de ',
          bold('Screens'),
          ' (vistas), ',
          bold('Components'),
          ' (componentes reutilizables) y ',
          bold('Containers'),
          ' (gestores de lógica de negocio y acceso a datos).'
        ),

        empty(),
        para(bold('Submódulos de Supabase:')),
        bul('PostgreSQL Database: Tablas de usuarios, perfiles profesionales, servicios, conversaciones de chat, mensajes, reseñas, favoritos y trabajos realizados.'),
        bul('Supabase Auth: Gestión de registro e inicio de sesión con correo/contraseña, autenticación con Google OAuth y sesiones persistentes mediante JWT tokens.'),
        bul('Supabase Storage: Almacenamiento de imágenes de perfil, fotos de portafolio de trabajos y recursos multimedia de la aplicación con control de acceso seguro.'),
        bul('Supabase Realtime: Canal de tiempo real para sincronización instantánea del chat entre usuarios y notificaciones de cambio de estado de trabajos.'),

        empty(),
        para(bold('Submódulos de la Aplicación Móvil (React Native + Expo):')),
        bul('Auth Module: Screens de Welcome, Login, Register (Welcome → Name → Birth → Gender → Auth).'),
        bul('Home Module: Screen principal con exploración de profesionales por categoría, barra de búsqueda y secciones dinámicas (Más solicitados, Novedades, Cerca de ti).'),
        bul('Chat Module: Sistema de mensajería en tiempo real (ChatListScreen, ChatScreen) con gestión de solicitudes, aceptación/rechazo y estados de trabajo (pendiente, en curso, finalizado, abortado).'),
        bul('Profile Module: Gestión del perfil profesional con portafolio de trabajos, calificación promedio, reseñas y estadísticas de trabajos completados.'),
        bul('Favorites Module: Sistema de guardado y consulta de perfiles profesionales favoritos con sincronización en Supabase.'),
        bul('AI Module (Sula AI): Asistente virtual integrado en la aplicación basado en inteligencia artificial.'),
        bul('Settings Module: Configuración de cuenta, preferencias y cierre de sesión.'),

        empty(),
        para(bold('Submódulos de la Aplicación Web (React Native Web):')),
        bul('Auth Web: Inicio de sesión y registro accesible desde navegador (comparte lógica con la app móvil).'),
        bul('Professional Listings: Visualización del catálogo de profesionales disponibles con filtros por categoría.'),
        bul('Professional Profile Web: Vista detallada del perfil de un profesional con sus trabajos y reseñas.'),
        bul('Admin Panel: Panel de control para gestión y moderación de usuarios y contenido de la plataforma.'),

        para(ital('[Insertar aquí el Diagrama de Componentes Nivel 1 – elaborado en Lucidchart o draw.io]')),
        note('Diagrama de componentes de nivel 1 con los subcomponentes de cada módulo principal del sistema. Fuente propia, elaborado en Lucidchart.'),

        empty(),

        // ─── Nivel 2 ─────────────────────────────────────────
        sub('3.3.3 Diagrama de Componentes de Nivel 2'),
        empty(),

        para(
          'El diagrama de nivel 2 representa el ',
          bold('flujo de datos unidireccional'),
          ' dentro de la aplicación, mostrando cómo la información circula desde el servidor de Supabase hasta las vistas de usuario. El flujo sigue el siguiente ciclo:'
        ),

        bul('El usuario realiza una acción en la interfaz de usuario (Screen o Component de React Native).'),
        bul('La acción activa un handler que llama a los servicios de Supabase a través del SDK oficial (@supabase/supabase-js).'),
        bul('Supabase procesa la solicitud: lectura o escritura en PostgreSQL, autenticación mediante JWT, o acceso a Storage para archivos multimedia.'),
        bul('La respuesta de Supabase actualiza el estado local de la aplicación mediante Context API o hooks de estado (useState, useEffect).'),
        bul('El estado actualizado se propaga automáticamente a todos los componentes suscritos, reflejando la información en tiempo real en la interfaz de usuario.'),
        bul('Para el chat y notificaciones en tiempo real, Supabase Realtime mantiene un canal WebSocket activo que notifica a todos los participantes de la conversación ante cualquier cambio en la base de datos.'),

        para(
          'Este flujo garantiza la sincronización en tiempo real entre todos los usuarios de la plataforma, característica esencial para el correcto funcionamiento del sistema de chat, las actualizaciones de estados de trabajo y las notificaciones del sistema ',
          bold('(Supabase, 2024; React Native, 2024)'),
          '.'
        ),

        para(ital('[Insertar aquí el Diagrama de Componentes Nivel 2 – elaborado en Lucidchart o draw.io]')),
        note('Diagrama de componentes de nivel 2 mostrando el flujo de datos unidireccional entre la interfaz, el estado de la aplicación y Supabase como backend. Fuente propia, elaborado en Lucidchart.'),

        empty(),

        // ─── Referencias ─────────────────────────────────────
        heading('Referencias para esta sección'),
        empty(),
        para(bold('Bernal, F. '), '(27 de septiembre de 2024). React: ¿Container-Component? statefull.medium.com. Obtenido de https://goo.su/LC1LiC'),
        para(bold('MDN Web Docs. '), '(s.f.). MVC. Mozilla Developer Network. Obtenido de https://developer.mozilla.org/es/docs/Glossary/MVC'),
        para(bold('Prawira, R. '), '(19 de febrero de 2025). Comprensión del patrón MVC para una arquitectura de código limpio. medium.com. Obtenido de https://goo.su/FPAWP'),
        para(bold('React Native. '), '(2024). Introduction – React Native. Meta Platforms. Obtenido de https://reactnative.dev/docs/getting-started'),
        para(bold('Supabase. '), '(2024). Supabase Documentation. Supabase Inc. Obtenido de https://supabase.com/docs'),

        empty(),
        para(
          bold('[NOTA PARA EL AUTOR]: '),
          'Debes crear los 3 diagramas (Nivel 0, 1 y 2) en Lucidchart (lucidchart.com) o draw.io (diagrams.net), ambos son GRATUITOS. El Nivel 0 muestra los 3 bloques principales (Supabase, App Móvil, App Web). El Nivel 1 desglosa los módulos internos de cada bloque. El Nivel 2 muestra el flujo de datos con flechas. IMPORTANTE: tu tabla de tecnologías actual en el documento dice "Firebase v11.7.3" — debes actualizarla a Supabase con su versión correcta.'
        ),
      ]
    }]
  });

  await save(doc, '03_Diseno_Arquitectonico_v2.docx');
}

crearArquitectura().catch(e => {
  console.error('❌ Error:', e.message);
  console.error(e.stack);
});
