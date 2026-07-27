// ============================================================
// Generador de propuestas DOCX para Le Chambea
// Genera 5 documentos Word en la carpeta propuestas
// ============================================================
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, Header, Footer, PageNumber,
  NumberFormat, LevelFormat, convertInchesToTwip, SpacingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\Users\\GHKennTole\\Desktop\\Le_Chambea\\Documentcion\\propuestas';

// ── Helpers ─────────────────────────────────────────────────
const bold = (t, size = 24) => new TextRun({ text: t, bold: true, font: 'Times New Roman', size });
const norm = (t, size = 24) => new TextRun({ text: t, font: 'Times New Roman', size });
const ital = (t, size = 24) => new TextRun({ text: t, italics: true, font: 'Times New Roman', size });

const heading = (text, level = 1) => new Paragraph({
  heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
  spacing: { line: 480, lineRule: 'AUTO', before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: level === 1 ? 28 : 26, allCaps: false })]
});

const subheading = (text) => heading(text, 2);

const para = (...runs) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 480, lineRule: 'AUTO', before: 0, after: 120 },
  children: runs.map(r => typeof r === 'string' ? norm(r) : r)
});

const bullet = (text) => new Paragraph({
  bullet: { level: 0 },
  spacing: { line: 480, lineRule: 'AUTO', before: 0, after: 60 },
  alignment: AlignmentType.JUSTIFIED,
  children: [norm(text)]
});

const boldPara = (label, rest) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 480, lineRule: 'AUTO', before: 0, after: 120 },
  children: [bold(label), typeof rest === 'string' ? norm(rest) : rest]
});

const empty = () => new Paragraph({ spacing: { line: 480, lineRule: 'AUTO' }, children: [norm('')] });

const note = (text) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, lineRule: 'AUTO', before: 60, after: 120 },
  children: [ital('Nota. '), norm(text)]
});

function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(cell => new TableCell({
      shading: isHeader ? { fill: '1F3864', type: ShadingType.CLEAR, color: 'auto' } : undefined,
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 360, lineRule: 'AUTO' },
        children: [new TextRun({ text: cell, bold: isHeader, color: isHeader ? 'FFFFFF' : '000000', font: 'Times New Roman', size: 22 })]
      })]
    }))
  });
}

// ── Guardar documento ────────────────────────────────────────
async function save(doc, filename) {
  const buf = await Packer.toBuffer(doc);
  const out = path.join(OUT, filename);
  fs.writeFileSync(out, buf);
  console.log('✅ Creado:', filename, '(' + Math.round(buf.length / 1024) + ' KB)');
}

// ════════════════════════════════════════════════════════════
// DOCUMENTO 1: I. Problema
// ════════════════════════════════════════════════════════════
async function crearProblema() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        heading('I. Problema'),
        empty(),

        para('En Nicaragua, y particularmente en ciudades intermedias como Juigalpa, departamento de Chontales, una parte significativa de la fuerza laboral se desempeña de manera independiente, ofreciendo servicios técnicos y profesionales que carecen de visibilidad digital. Esta realidad refleja una brecha estructural que se extiende a lo largo de toda América Latina, donde la informalidad laboral ha crecido de manera sostenida en la última década, impactando directamente en el desarrollo económico de las comunidades locales.'),

        para('Según la Comisión Económica para América Latina y el Caribe, la ocupación informal en la región aumentó un 18.6%, pasando de aproximadamente 101.2 millones de personas en 2013 a 120 millones en 2022, siendo Nicaragua uno de los países con mayor tasa de informalidad laboral ', bold('(Pineda, 2024)'), '. Esta situación implica que millones de trabajadores operan sin acceso a herramientas que les permitan promocionar sus servicios de manera efectiva y alcanzar a nuevos clientes potenciales.'),

        para('A nivel global, la tecnología ha comenzado a transformar la manera en que los profesionales independientes se conectan con sus clientes. La Organización Internacional del Trabajo señala que el trabajo por plataformas digitales experimentó un crecimiento acelerado, aunque su impacto en países en desarrollo como Nicaragua sigue siendo limitado debido a la brecha tecnológica existente en comunidades semiurbanas y rurales ', bold('(OIT, 2023)'), '. Plataformas globales como Upwork, Fiverr o Workana están orientadas principalmente a habilidades digitales especializadas —programación, diseño, marketing— y no contemplan servicios técnicos presenciales como carpintería, electricidad, plomería, costura o mecánica, que son los más comunes en el mercado informal de ciudades como Juigalpa ', bold('(Payoneer Team, 2025)'), '.'),

        para('Esta desconexión entre la oferta de servicios profesionales locales y la demanda ciudadana impacta directamente en la economía de las familias. Los emprendedores independientes dependen casi exclusivamente del "boca a boca" como mecanismo de visibilización, lo cual restringe su alcance a un radio muy limitado de contactos conocidos ', bold('(ADEN, 2025)'), '. Por otro lado, los ciudadanos que buscan servicios confiables enfrentan dificultades para encontrar profesionales verificados con referencias y con historial de trabajo comprobable en su propia comunidad, lo que genera desconfianza y dificulta la contratación de servicios de manera segura.'),

        para('Adicionalmente, el creciente acceso a dispositivos móviles en Centroamérica representa una oportunidad desaprovechada. Según la GSMA ', bold('(2024)'), ', la penetración de smartphones en América Latina y el Caribe continúa en ascenso, abriendo una ventana de oportunidad para el desarrollo de soluciones digitales accesibles que sirvan como puente entre profesionales independientes y sus potenciales clientes. Sin embargo, esta oportunidad no ha sido capitalizada en el contexto específico de ciudades intermedias nicaragüenses, donde la oferta de plataformas digitales que faciliten esta conexión es prácticamente inexistente.'),

        empty(),
        heading('Referencias utilizadas en esta sección'),
        empty(),

        para(bold('ADEN. '), '(18 de marzo de 2025). Emprender en Latinoamérica: desafíos y consejos. Obtenido de https://www.aden.org/business-magazine/emprender-en-latinoamerica-desafios-y-retos/'),
        para(bold('GSMA. '), '(2024). The Mobile Economy Latin America and Caribbean 2024. GSMA Intelligence. Obtenido de https://www.gsma.com/solutions-and-impact/connectivity/mobile-economy/latin-america/'),
        para(bold('Organización Internacional del Trabajo (OIT). '), '(2023). Perspectivas Sociales y del Empleo en el Mundo: Tendencias 2023. Ginebra: OIT. Obtenido de https://www.ilo.org/wcmsp5/groups/public/---dgreports/---inst/documents/publication/wcms_900651.pdf'),
        para(bold('Payoneer Team. '), '(16 de abril de 2025). Las 13 habilidades freelance de alta demanda en el mercado actual. Payoneer. Obtenido de https://www.payoneer.com/es/resources/business/las-13-habilidades-freelance-de-alta-demanda-en-el-mercado-actual/'),
        para(bold('Pineda, R. y Otros. '), '(2024). Empleo informal en América Latina: grupos más propensos. Santiago: Comisión Económica para América Latina y el Caribe (CEPAL).'),

        empty(),
        para(bold('[NOTA PARA EL AUTOR]: '), 'Esta sección debe ir ANTES de la sección "II. Solución". Agrega estadísticas locales de Nicaragua si las consigues (INIDE, BCN, COSEP). También puedes buscar datos de acceso a internet y smartphones en Chontales.'),
      ]
    }]
  });
  await save(doc, '01_Seccion_Problema.docx');
}

// ════════════════════════════════════════════════════════════
// DOCUMENTO 2: II. Solución (revisada y separada)
// ════════════════════════════════════════════════════════════
async function crearSolucion() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        heading('II. Solución'),
        empty(),

        para('Actualmente el concepto de ser tu propio jefe se ha convertido en una de las convicciones más adoptadas por la población latinoamericana, pues las personas con esta filosofía de vida prefieren optar por iniciar un negocio propio para no tener que depender de un tercero para obtener ingresos económicos. Según ', bold('(Pineda, 2024)'), ', en América Latina más de la mitad de los trabajadores están en la informalidad, y esta proporción ha aumentado sostenidamente en la última década. No podemos dejar de contemplar a la tecnología como aliada de este fenómeno, pues esta desempeña un papel fundamental en el emprendedurismo, permitiendo la creación de nuevos modelos de negocio y la expansión de mercados ', bold('(ADEN, 2025)'), '.'),

        para('Aunque existen plataformas como LinkedIn, Upwork, Fiverr o Workana, hay una limitante fundamental: están dirigidas hacia un grupo concreto de personas con habilidades que puedan ser explotadas de manera virtual, como programación, diseño o marketing ', bold('(Payoneer Team, 2025; Puerto, 2025)'), '. Estas habilidades contrastan con las comúnmente encontradas en países con menor tasa de educación universitaria, donde gran parte de la población trabaja de forma independiente con habilidades técnicas y prácticas.'),

        para('La solución propuesta es ', bold('Le Chambea'), ', una aplicación móvil y web orientada a la conexión entre clientes y profesionales de cualquier ámbito, priorizando dar visibilidad a los emprendedores que están en sus inicios o que, por diferentes razones, no son ampliamente reconocidos en su comunidad, pero poseen las capacidades y habilidades necesarias para realizar un trabajo de calidad en la ciudad de Juigalpa, Chontales. La plataforma integra inteligencia artificial para analizar necesidades, brindar asistencia personalizada y recomendar servicios profesionales adecuados, contribuyendo a la digitalización de oportunidades laborales y al crecimiento económico de la comunidad.'),

        para('Le Chambea permite a los profesionales independientes crear un perfil digital con su información, especialidades, fotografías de trabajos realizados y calificaciones de clientes previos. Los ciudadanos que buscan un servicio pueden explorar perfiles por categoría profesional, ubicación o popularidad, contactar directamente a través del chat integrado en la plataforma y valorar el servicio recibido mediante un sistema de reseñas. La integración con inteligencia artificial, denominada ', bold('Chambi AI'), ', asiste a los usuarios brindándoles recomendaciones personalizadas y respondiendo consultas relacionadas con los servicios disponibles en la plataforma.'),

        empty(),
        para(bold('Objetivo General')),
        para('Desarrollo de una aplicación móvil y web "Le Chambea", como una plataforma digital que facilite la conexión entre profesionales y empleadores, promoviendo oportunidades de crecimiento económico en la ciudad de Juigalpa, Chontales, en el segundo semestre del año 2025, utilizando la metodología ágil Scrum y las tecnologías React Native, React Native Web con Supabase.'),

        empty(),
        para(bold('Objetivos Específicos')),
        bullet('Analizar las necesidades de los usuarios e implementación de las características y funcionalidades que requieran.'),
        bullet('Diseñar un sistema móvil con interfaz de usuario intuitiva y adaptable que facilite la navegación y conexión entre profesionales y clientes.'),
        bullet('Desarrollar el código frontend con React Native y React Native Web, integrando servicios de Supabase para autenticación y base de datos relacional en tiempo real.'),
        bullet('Incorporar funcionalidades como chat entre usuarios, sistema de favoritos, recomendaciones de profesionales y asistencia virtual para mejorar la experiencia del usuario.'),
        bullet('Validar el funcionamiento de la aplicación mediante pruebas funcionales, de usabilidad y entornos simulados para detectar y corregir errores.'),

        empty(),
        heading('Referencias utilizadas en esta sección'),
        empty(),
        para(bold('ADEN. '), '(2025). Emprender en Latinoamérica: desafíos y consejos. https://www.aden.org/business-magazine/emprender-en-latinoamerica-desafios-y-retos/'),
        para(bold('Instituto Europeo de Posgrado. '), '(13 de abril de 2022). ¿Qué redes sociales me ayudan en mi carrera profesional? Obtenido de https://iep.edu.es/redes-sociales-profesionales/'),
        para(bold('Payoneer Team. '), '(2025). Las 13 habilidades freelance de alta demanda. https://www.payoneer.com/es/resources/business/las-13-habilidades-freelance-de-alta-demanda-en-el-mercado-actual/'),
        para(bold('Pineda, R. '), '(2024). Empleo informal en América Latina: grupos más propensos. CEPAL.'),
        para(bold('Puerto, M. '), '(25 de marzo de 2025). Las 7 mejores plataformas para encontrar trabajos freelance en español en 2025. xolo. Obtenido de https://blog.xolo.io/es/7-mejores-plataformas-para-trabajos-freelance-espanol-2025'),

        empty(),
        para(bold('[NOTA PARA EL AUTOR]: '), 'Esta sección es la versión revisada de tu "Solución" original, ahora separada del "Problema". El contenido académico ya estaba bien escrito; solo se reorganizó y completó para mantener la coherencia narrativa.'),
      ]
    }]
  });
  await save(doc, '02_Seccion_Solucion.docx');
}

// ════════════════════════════════════════════════════════════
// DOCUMENTO 3: Diseño Arquitectónico (3.3)
// ════════════════════════════════════════════════════════════
async function crearArquitectura() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        heading('3.3 Diseño Arquitectónico'),
        empty(),

        para('Le Chambea utiliza el patrón de arquitectura ', bold('Container/Components'), ', comúnmente empleado en aplicaciones desarrolladas con React y React Native. Este patrón permite una mejor separación de responsabilidades dentro del proyecto: los Containers se encargan de manejar la lógica de negocio y el acceso a datos, mientras que los Components se enfocan exclusivamente en la presentación visual de la interfaz de usuario. Esta separación hace que el código sea más limpio, reutilizable y fácil de mantener ', bold('(Bernal, 2024)'), '.'),

        para('Adicionalmente, la arquitectura sigue el patrón ', bold('MVC (Model-View-Controller)'), ', el cual es comúnmente utilizado para implementar interfaces de usuario, datos y lógica de control. Este patrón enfatiza una mejor separación entre la lógica de negocio y su visualización, siendo ideal para proyectos de mediana y gran escala donde la arquitectura modular es esencial para manejar la complejidad y el crecimiento del sistema ', bold('(MDN Web Docs, s.f.; Prawira, 2025)'), '.'),

        para('En Le Chambea, el modelo de datos es gestionado por ', bold('Firebase'), ' (Firestore Database, Authentication y Storage), la vista es implementada a través de los componentes de React Native y React Native Web, y el controlador es representado por los Context providers y hooks de estado que intermedian la comunicación entre los datos y la presentación.'),

        empty(),
        subheading('3.3.1 Diagrama de Componentes de Nivel 0'),
        empty(),

        para('El diagrama de nivel 0 representa la vista macroscópica del sistema, mostrando los tres módulos principales que componen la arquitectura de Le Chambea y la forma en que se interrelacionan a nivel de sistema. Los módulos principales son: la capa de presentación con las aplicaciones de React Native (móvil) y React Native Web, y la capa de datos con Firebase como servicio de backend.'),

        empty(),
        para(bold('Módulo 1 – Firebase (Backend as a Service / BaaS)')),
        para('Provee todos los servicios del backend de la aplicación: la base de datos NoSQL en tiempo real (Firestore), el sistema de autenticación de usuarios (Firebase Auth) y el almacenamiento de archivos multimedia (Firebase Storage). Este módulo actúa como el servidor centralizado al que se conectan ambas interfaces de la aplicación.'),

        para(bold('Módulo 2 – Aplicación Móvil (React Native + Expo)')),
        para('Interfaz de usuario para dispositivos Android e iOS, desarrollada con React Native y gestionada con Expo. Consume los servicios de Firebase mediante el SDK oficial de Firebase para React Native y se comunica en tiempo real con la base de datos Firestore para mostrar información actualizada al instante.'),

        para(bold('Módulo 3 – Aplicación Web (React Native Web)')),
        para('Versión web de la aplicación, desarrollada con React Native Web, que comparte la misma base de código que la aplicación móvil. Accede igualmente a Firebase para autenticación y datos, y permite a los usuarios acceder a la plataforma desde cualquier navegador de escritorio o móvil.'),

        para(ital('[Insertar aquí el Diagrama de Componentes Nivel 0 – elaborado en Lucidchart o draw.io]')),
        note('Diagrama de componentes de nivel 0 mostrando los tres módulos principales del sistema Le Chambea. Fuente propia, elaborado en Lucidchart.'),

        empty(),
        subheading('3.3.2 Diagrama de Componentes de Nivel 1'),
        empty(),

        para('El diagrama de nivel 1 refleja los componentes y las relaciones de cada módulo de la aplicación, definiendo los subcomponentes de Screens (vistas), Components (componentes reutilizables) y Containers (gestores de lógica). Este nivel desglosa cada módulo principal en sus funcionalidades internas:'),

        empty(),
        para(bold('Submódulos de Firebase:')),
        bullet('Firestore Database: Colecciones de usuarios, profesionales, servicios contratados, mensajes de chat, reseñas y favoritos.'),
        bullet('Firebase Authentication: Gestión de registro e inicio de sesión con correo/contraseña y autenticación con Google OAuth.'),
        bullet('Firebase Storage: Almacenamiento de imágenes de perfil, fotos de portafolio de trabajos y recursos multimedia de la aplicación.'),

        empty(),
        para(bold('Submódulos de la Aplicación Móvil (React Native):')),
        bullet('Auth Module: Screens de Login, Register (Welcome, Name, Birth, Gender, Auth).'),
        bullet('Home Module: Screen principal con exploración de profesionales, búsqueda y categorías.'),
        bullet('Chat Module: Sistema de mensajería en tiempo real (ChatList, ChatScreen) con gestión de solicitudes de trabajo.'),
        bullet('Profile Module: Gestión del perfil de usuario profesional y cliente.'),
        bullet('Favorites Module: Sistema de guardado y consulta de perfiles profesionales favoritos.'),
        bullet('AI Module (Chambi AI): Asistente virtual integrado basado en inteligencia artificial.'),
        bullet('Settings Module: Configuración de cuenta y preferencias del usuario.'),

        empty(),
        para(bold('Submódulos de la Aplicación Web (React Native Web):')),
        bullet('Auth Web: Inicio de sesión y registro accesible desde navegador.'),
        bullet('Professional Listings: Visualización del catálogo de profesionales disponibles.'),
        bullet('Admin Panel: Panel de control para gestión y moderación de usuarios y contenido.'),

        para(ital('[Insertar aquí el Diagrama de Componentes Nivel 1 – elaborado en Lucidchart o draw.io]')),
        note('Diagrama de componentes de nivel 1 con los subcomponentes de cada módulo principal del sistema. Fuente propia, elaborado en Lucidchart.'),

        empty(),
        subheading('3.3.3 Diagrama de Componentes de Nivel 2'),
        empty(),

        para('El diagrama de nivel 2 representa el flujo de datos dentro de la aplicación, mostrando cómo la información circula desde el servidor de Firebase hasta las vistas de usuario. En Le Chambea, el flujo de datos es ', bold('unidireccional'), ' y sigue el siguiente ciclo:'),

        bullet('El usuario realiza una acción en la interfaz de usuario (Screen o Component de React Native).'),
        bullet('La acción activa un handler que llama a los servicios de Firebase a través del SDK oficial.'),
        bullet('Firebase procesa la solicitud (lectura o escritura en Firestore, autenticación, o acceso a Storage) y devuelve la respuesta.'),
        bullet('La respuesta actualiza el estado local de la aplicación mediante Context API o useState hooks.'),
        bullet('El estado actualizado se propaga automáticamente a todos los componentes suscritos, reflejando la información en tiempo real en la interfaz de usuario.'),

        para('Este flujo garantiza la sincronización en tiempo real entre todos los usuarios de la plataforma, característica esencial para el correcto funcionamiento del sistema de chat en tiempo real, las actualizaciones de perfiles profesionales y las notificaciones del sistema ', bold('(Firebase, 2024; React Native, 2024)'), '.'),

        para(ital('[Insertar aquí el Diagrama de Componentes Nivel 2 – elaborado en Lucidchart o draw.io]')),
        note('Diagrama de componentes de nivel 2 mostrando el flujo unidireccional de datos entre la interfaz, el estado de la aplicación y Firebase. Fuente propia, elaborado en Lucidchart.'),

        empty(),
        heading('Referencias para esta sección'),
        empty(),
        para(bold('Bernal, F. '), '(27 de septiembre de 2024). React: ¿Container-Component? statefull.medium.com. https://goo.su/LC1LiC'),
        para(bold('Firebase. '), '(2024). Firebase Documentation. Google. Obtenido de https://firebase.google.com/docs'),
        para(bold('MDN Web Docs. '), '(s.f.). MVC. Mozilla Developer Network. Obtenido de https://developer.mozilla.org/es/docs/Glossary/MVC'),
        para(bold('Prawira, R. '), '(19 de febrero de 2025). Comprensión del patrón MVC para una arquitectura de código limpio. medium.com. https://goo.su/FPAWP'),
        para(bold('React Native. '), '(2024). Introduction – React Native. Meta Platforms. Obtenido de https://reactnative.dev/docs/getting-started'),

        empty(),
        para(bold('[NOTA PARA EL AUTOR]: '), 'Debes crear los 3 diagramas (Nivel 0, 1, 2) en Lucidchart (lucidchart.com) o draw.io (diagrams.net), que son gratuitos. Inspírate en el estilo de CentralCoffee. Los textos explicativos ya están listos arriba. Nota: Bernal (2024) y Prawira (2025) y MDN son las mismas referencias que usó CentralCoffee — busca esos artículos en línea para citarlos.'),
      ]
    }]
  });
  await save(doc, '03_Diseno_Arquitectonico.docx');
}

// ════════════════════════════════════════════════════════════
// DOCUMENTO 4: Diseño de Navegación Web (3.2.2)
// ════════════════════════════════════════════════════════════
async function crearNavegacionWeb() {
  const webViews = [
    {
      id: 'WEB-01', nombre: 'Landing / Home Web',
      objetivo: 'Ofrecer la pantalla principal de la versión web de Le Chambea, permitiendo a visitantes y usuarios explorar el catálogo de profesionales disponibles, buscar por nombre o profesión, y acceder al inicio de sesión o registro.',
      validaciones: ['Verificación de carga del catálogo de profesionales desde Firestore.', 'Validación de funcionamiento de la barra de búsqueda y filtros por categoría.', 'Control de sesión activa para mostrar opciones de perfil o de inicio de sesión.'],
      elementos: ['Barra de navegación superior con logo y menú de navegación.', 'Barra de búsqueda de profesionales por nombre o especialidad.', 'Filtros por categoría de servicio (Electricidad, Carpintería, Plomería, etc.).', 'Grilla de tarjetas de profesionales con foto, nombre, especialidad y calificación.', 'Botones de "Ver perfil" en cada tarjeta de profesional.', 'Footer con información de contacto y enlaces de la plataforma.'],
      interacciones: ['Clic en la barra de búsqueda para ingresar términos de búsqueda.', 'Clic en un filtro de categoría para mostrar únicamente profesionales de esa especialidad.', 'Clic en "Ver perfil" para redirigir al perfil detallado del profesional.', 'Clic en "Iniciar sesión" para redirigir al formulario de autenticación.'],
      flujo: 'Ver perfil → Perfil de Profesional | Iniciar sesión → Login Web'
    },
    {
      id: 'WEB-02', nombre: 'Login Web',
      objetivo: 'Proporcionar el formulario de inicio de sesión para usuarios de la versión web, permitiendo autenticación con correo y contraseña o mediante cuenta de Google.',
      validaciones: ['Validación del formato correcto del correo electrónico.', 'Verificación de existencia del usuario en la base de datos Firebase Auth.', 'Validación de contraseña correcta mediante token de seguridad.', 'Control de navegación hacia el Home al autenticarse correctamente.'],
      elementos: ['Logo y nombre de la aplicación Le Chambea.', 'Campo de texto para correo electrónico.', 'Campo de texto para contraseña con opción de mostrar/ocultar.', 'Botón "Iniciar sesión".', 'Enlace "¿Olvidaste tu contraseña?".', 'Botón "Continuar con Google".', 'Enlace "¿No tienes cuenta? Regístrate".'],
      interacciones: ['Clic en campo de correo para ingresar el correo registrado.', 'Clic en campo de contraseña para ingresar la contraseña.', 'Clic en "Iniciar sesión" para autenticar y redirigir al Home.', 'Clic en "Continuar con Google" para autenticar con OAuth de Google.', 'Clic en "Regístrate" para redirigir al formulario de registro.'],
      flujo: 'Autenticación exitosa → Home Web | Registrarse → Registro Web'
    },
    {
      id: 'WEB-03', nombre: 'Registro Web',
      objetivo: 'Ofrecer el formulario de creación de cuenta para nuevos usuarios en la versión web, recopilando la información necesaria para establecer su perfil en la plataforma.',
      validaciones: ['Validación de formato correcto del correo electrónico.', 'Validación de contraseña segura (mínimo 8 caracteres, letras y números).', 'Verificación de coincidencia entre contraseña y confirmación.', 'Verificación de disponibilidad del correo (sin cuentas duplicadas).'],
      elementos: ['Formulario de registro en una sola página.', 'Campos: Nombre, Apellido, Correo electrónico, Contraseña, Confirmar contraseña.', 'Selector de tipo de usuario (Profesional / Cliente).', 'Botón "Crear cuenta".', 'Botón "Registrarse con Google".'],
      interacciones: ['Completar los campos del formulario de registro.', 'Seleccionar tipo de usuario (Profesional o Cliente).', 'Clic en "Crear cuenta" para registrar y redirigir al Home.', 'Clic en "Registrarse con Google" para registro rápido.'],
      flujo: 'Registro exitoso → Home Web'
    },
    {
      id: 'WEB-04', nombre: 'Perfil de Profesional Web',
      objetivo: 'Mostrar el perfil detallado de un profesional, incluyendo su información personal, especialidades, portafolio de trabajos, calificación promedio y reseñas de clientes anteriores.',
      validaciones: ['Verificación de carga correcta del perfil desde Firestore.', 'Control de sesión activa para habilitar el botón de contacto por chat.', 'Verificación de carga de reseñas y calificación promedio.'],
      elementos: ['Foto de perfil del profesional.', 'Nombre completo y especialidad principal.', 'Calificación promedio con estrellas y número de reseñas.', 'Descripción personal / "Sobre mí".', 'Listado de habilidades y especialidades.', 'Galería de fotos de trabajos realizados.', 'Sección de reseñas de clientes.', 'Botón "Contactar" (activa chat si el usuario tiene sesión iniciada).'],
      interacciones: ['Visualizar la información completa del perfil profesional.', 'Clic en fotos de la galería para verlas en tamaño completo.', 'Clic en "Contactar" para iniciar una conversación de chat con el profesional.'],
      flujo: 'Contactar → Chat Web | Sin sesión → Redirige a Login'
    },
    {
      id: 'WEB-05', nombre: 'Panel de Administración Web',
      objetivo: 'Proporcionar al usuario Administrador una interfaz de gestión y supervisión del contenido y usuarios de la plataforma Le Chambea.',
      validaciones: ['Verificación de rol de Administrador para acceso exclusivo a este panel.', 'Control de sesión activa con permisos de administrador.', 'Verificación de carga correcta de listados de usuarios y contenido.'],
      elementos: ['Menú lateral de administración con secciones: Usuarios, Profesionales, Reseñas, Reportes.', 'Tabla de usuarios registrados con opciones de gestión (activar/desactivar cuenta).', 'Tabla de perfiles profesionales con opción de verificar o suspender.', 'Sección de reportes de comportamiento inadecuado entre usuarios.', 'Estadísticas generales de uso de la plataforma.'],
      interacciones: ['Clic en "Usuarios" para gestionar cuentas registradas en la plataforma.', 'Clic en "Profesionales" para revisar y verificar perfiles profesionales.', 'Clic en "Reportes" para revisar y gestionar reportes de comportamiento.', 'Activar o desactivar cuentas según las políticas de uso de la plataforma.'],
      flujo: 'Acceso exclusivo para usuario con rol Administrador'
    }
  ];

  const allParas = [
    heading('3.2.2 Diseño de Navegación Web'),
    empty(),
    para('El diseño de navegación web de Le Chambea representa la estructura de vistas y el flujo de interacción disponible para los usuarios que acceden a la plataforma desde un navegador web en dispositivos de escritorio o móviles. La versión web comparte la lógica de negocio con la aplicación móvil, desarrollada con React Native Web, y está orientada a los tres tipos de usuarios del sistema: Cliente, Profesional y Administrador ', bold('(INTERACTION DESIGN FOUNDATION, s.f.)'), '.'),
    para(ital('[Insertar aquí el Diagrama de Navegación Web – mapa de navegación elaborado en Lucidchart, draw.io o Figma]')),
    note('Diagrama de diseño de navegación web de Le Chambea. Fuente propia, elaborado en Lucidchart.'),
    empty(),
  ];

  webViews.forEach((view, i) => {
    allParas.push(
      new Paragraph({
        spacing: { line: 480, lineRule: 'AUTO', before: 200, after: 100 },
        children: [new TextRun({ text: `Tabla ${i + 1} Diseño de vista ${view.nombre}`, bold: true, font: 'Times New Roman', size: 24 })]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          tableRow([`Vista: ${view.nombre} (${view.id})`, 'Descripción funcional y de diseño'], true),
          tableRow(['Objetivo', view.objetivo]),
          tableRow(['Validaciones', view.validaciones.map((v, i) => `${i + 1}. ${v}`).join('\n')]),
          tableRow(['Elementos', view.elementos.map(e => `❖ ${e}`).join('\n')]),
          tableRow(['Interacciones', view.interacciones.map(e => `❖ ${e}`).join('\n')]),
          tableRow(['Flujo', view.flujo]),
        ]
      }),
      note(`Descripción de los componentes funcionales y diseño de la vista ${view.nombre} en la versión web de Le Chambea.`),
      empty()
    );
  });

  allParas.push(
    heading('Referencias para esta sección'),
    empty(),
    para(bold('INTERACTION DESIGN FOUNDATION. '), '(s.f.). Navegación en el diseño UX/UI. IxDF. Obtenido de https://www.interaction-design.org/literature/topics/navigation'),
    para(bold('React Native Web. '), '(2024). React Native for Web Documentation. Obtenido de https://necolas.github.io/react-native-web/'),
    empty(),
    para(bold('[NOTA PARA EL AUTOR]: '), 'Debes crear el diagrama de navegación web en Lucidchart o Figma (gratuito en figma.com). El diagrama debe mostrar cómo se conectan estas 5 vistas entre sí con flechas de navegación, igual que el Figura 20 del CentralCoffee PDF (página 39). Este documento ya tiene todos los textos de las tablas listos para copiar a tu plantilla principal.'),
  );

  const doc = new Document({ sections: [{ properties: {}, children: allParas }] });
  await save(doc, '04_Navegacion_Web.docx');
}

// ════════════════════════════════════════════════════════════
// DOCUMENTO 5: Referencias Adicionales Sugeridas
// ════════════════════════════════════════════════════════════
async function crearReferencias() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        heading('Referencias Bibliográficas Adicionales Sugeridas'),
        para('Las siguientes referencias están organizadas por sección y listas para agregar a la bibliografía del documento principal. Actualmente el documento tiene 14 referencias. El mínimo requerido es 60. Con estas sugerencias se llega a aproximadamente 40 referencias. Se deben buscar entre 20-25 referencias adicionales más.'),
        empty(),

        subheading('Para la sección I. Problema'),
        para(bold('GSMA. '), '(2024). The Mobile Economy Latin America and Caribbean 2024. GSMA Intelligence. Obtenido de https://www.gsma.com/solutions-and-impact/connectivity/mobile-economy/latin-america/'),
        para(bold('Organización Internacional del Trabajo (OIT). '), '(2023). Perspectivas Sociales y del Empleo en el Mundo: Tendencias 2023. Ginebra: Organización Internacional del Trabajo. Obtenido de https://www.ilo.org/wcmsp5/groups/public/---dgreports/---inst/documents/publication/wcms_900651.pdf'),
        para(bold('Banco Mundial. '), '(2024). Nicaragua – Panorama general. World Bank. Obtenido de https://www.bancomundial.org/es/country/nicaragua/overview'),
        para(bold('INIDE. '), '(2021). Encuesta Continua de Hogares. Instituto Nacional de Información de Desarrollo de Nicaragua. Obtenido de https://www.inide.gob.ni/Home/Encuesta'),
        empty(),

        subheading('Para la sección II. Solución'),
        para(bold('Instituto Europeo de Posgrado. '), '(13 de abril de 2022). ¿Qué redes sociales me ayudan en mi carrera profesional? Obtenido de https://iep.edu.es/redes-sociales-profesionales/'),
        para(bold('Puerto, M. '), '(25 de marzo de 2025). Las 7 mejores plataformas para encontrar trabajos freelance en español en 2025. xolo. Obtenido de https://blog.xolo.io/es/7-mejores-plataformas-para-trabajos-freelance-espanol-2025'),
        empty(),

        subheading('Para la sección III. Diseño o Modelo / Arquitectura'),
        para(bold('Bernal, F. '), '(27 de septiembre de 2024). React: ¿Container-Component? statefull.medium.com. Obtenido de https://goo.su/LC1LiC'),
        para(bold('Firebase. '), '(2024). Firebase Documentation. Google. Obtenido de https://firebase.google.com/docs'),
        para(bold('IBM. '), '(5 de marzo de 2021). El modelo de diseño. IBM. Obtenido de https://www.ibm.com/docs/es/dmrt/9.5.0?topic=approaches-design-model'),
        para(bold('INTERACTION DESIGN FOUNDATION. '), '(s.f.). Navegación en el diseño UX/UI. IxDF. Obtenido de https://www.interaction-design.org/literature/topics/navigation'),
        para(bold('MDN Web Docs. '), '(s.f.). MVC. Mozilla Developer Network. Obtenido de https://developer.mozilla.org/es/docs/Glossary/MVC'),
        para(bold('Martin, R. C. '), '(2018). Clean Architecture: A Craftsman\'s Guide to Software Structure and Design. Prentice Hall. ISBN: 978-0134494166.'),
        para(bold('Prawira, R. '), '(19 de febrero de 2025). Comprensión del patrón MVC para una arquitectura de código limpio. medium.com. Obtenido de https://goo.su/FPAWP'),
        para(bold('React Native. '), '(2024). Introduction – React Native. Meta Platforms. Obtenido de https://reactnative.dev/docs/getting-started'),
        para(bold('React Native Web. '), '(2024). React Native for Web Documentation. Obtenido de https://necolas.github.io/react-native-web/'),
        para(bold('Admin EngIndX. '), '(s.f.). Diseño funcional: cuando el negocio encuentra al software. Engineering Industries eXcellence. Obtenido de https://www.indx.com/es/posts/functional-design-where-business-meets-software'),
        empty(),

        subheading('Para la sección IV. Justificación Tecnológica'),
        para(bold('Back4app. '), '(s.f.). React Native: Ventajas y desventajas reveladas. Back4app Blog. Obtenido de https://blog.back4app.com/es/react-native-ventajas-y-desventajas-reveladas/'),
        para(bold('Expo. '), '(2024). Introduction to Expo. Expo. Obtenido de https://docs.expo.dev/'),
        para(bold('campusMVP. '), '(8 de agosto de 2023). React Native y Expo: qué son y cómo se relacionan. campusMVP. Obtenido de https://www.campusmvp.es/recursos/post/react-native-y-expo-que-son-y-como-se-relacionan.aspx'),
        para(bold('Netguru. '), '(s.f.). ¿Qué es React Native? Netguru. Obtenido de https://www.netguru.com/glossary/react-native'),
        para(bold('Stevenson, D. '), '(24 de septiembre de 2018). ¿Qué es Firebase? La historia completa, resumida. Medium. Obtenido de https://medium.com/firebase-developers/what-is-firebase-the-complete-story-abridged-bcc730c5f2c0'),
        para(bold('Supabase. '), '(2024). Supabase Documentation. Supabase Inc. Obtenido de https://supabase.com/docs'),
        para(bold('Vergara, S. '), '(24 de octubre de 2023). ¿Cómo elegir la mejor tecnología para tu proyecto? ITDO. Obtenido de https://www.itdo.com/blog/como-elegir-la-mejor-tecnologia-para-tu-proyecto/'),
        para(bold('webdesigncusco. '), '(s.f.). Ventajas y desventajas de Firebase para desarrollo de aplicaciones. webdesigncusco. Obtenido de https://webdesigncusco.com/ventajas-y-desventajas-de-firebase-para-desarrollo-de-aplicaciones/'),
        empty(),

        subheading('Para la sección V. Justificación de la Metodología'),
        para(bold('Coursera. '), '(15 de junio de 2023). Kanban vs. Scrum: ¿Cuál es la diferencia? Coursera.org. Obtenido de https://www.coursera.org/mx/articles/kanban-vs-scrum'),
        para(bold('Martins, J. '), '(15 de febrero de 2025). Scrum: conceptos clave y cómo se aplica en la gestión de proyectos. Asana. Obtenido de https://asana.com/es/resources/what-is-scrum'),
        para(bold('Melanie. '), '(7 de febrero de 2024). ¿Qué es la metodología Crystal? Características. blog.comparasoftware.com. Obtenido de https://blog.comparasoftware.com/metodologia-crystal/'),
        para(bold('Schwaber, K. & Sutherland, J. '), '(2020). La Guía de Scrum: La Guía Definitiva de Scrum: Las Reglas del Juego. Scrum.org. Obtenido de https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-Spanish-Latin-South-American.pdf'),
        empty(),

        subheading('Para las secciones IX. Marco Lógico y VIII. Presupuesto'),
        para(bold('Ingenio Empresa. '), '(2025). Marco lógico: Definición, elaboración y ejemplo detallado. ingenioempresa. Obtenido de https://ingenioempresa.com/marco-logico/'),
        para(bold('Maldonado, M. '), '(15 de agosto de 2023). Utiliza el Árbol del Problema para un análisis integral de causas y efectos. ilab. Obtenido de https://ilab.mx/2023/08/15/utilizarbol-del-problema/'),
        para(bold('Metodologías Participativas. '), '(2025). Árbol de soluciones. metodologiasparticipativas.com. Obtenido de https://www.metodologiasparticipativas.com/arbol-de-soluciones/'),
        para(bold('Raeburn, A. '), '(6 de febrero de 2025). Qué es product backlog y guía para hacer uno con ejemplo. Asana. Obtenido de https://asana.com/es/resources/product-backlog'),
        para(bold('Universidad Andres Bello. '), '(11 de junio de 2024). ¿Qué es un Árbol de Objetivos? Vinculación UNAB. Obtenido de https://vinculacion.unab.cl/herramientas/arbol-de-objetivos/'),
        para(bold('Westland, J. '), '(12 de marzo de 2025). Gestión de backlogs de productos y sprint: una guía rápida. Productmanager. Obtenido de https://productmanager.com/es/backlogs-productos-sprint/'),
        empty(),

        new Paragraph({
          spacing: { line: 480, lineRule: 'AUTO', before: 200 },
          children: [
            new TextRun({ text: 'RESUMEN: ', bold: true, font: 'Times New Roman', size: 24 }),
            new TextRun({ text: 'Referencias actuales en tu documento: 14  |  Referencias en este documento: 26  |  Total acumulado: ~40  |  Objetivo mínimo: 60  |  Faltan aproximadamente: 20 más.', font: 'Times New Roman', size: 24 })
          ]
        }),
      ]
    }]
  });
  await save(doc, '05_Referencias_Adicionales.docx');
}

// ── Ejecutar todos ───────────────────────────────────────────
(async () => {
  console.log('\n📁 Generando documentos en:', OUT);
  console.log('────────────────────────────────────────');
  try {
    await crearProblema();
    await crearSolucion();
    await crearArquitectura();
    await crearNavegacionWeb();
    await crearReferencias();
    console.log('────────────────────────────────────────');
    console.log('✅ ¡Todos los documentos generados exitosamente!');
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
  }
})();
