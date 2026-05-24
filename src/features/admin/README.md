# Módulo Administrador (Admin Feature)

Este directorio está reservado para la lógica y pantallas del rol de **Administrador** de la aplicación Le Chambea.

## 1. Diseño del Rol de Administrador en Base de Datos

En Supabase, tienes dos opciones principales para gestionar roles (como usuario regular, profesional y administrador):

### Opción A: Columna en la Tabla de Perfiles (Recomendada y más simple)
En tu tabla `usuarios` (o la tabla que maneje la información de usuario), puedes añadir una columna booleana o un enum de roles:
```sql
ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) DEFAULT 'usuario';
-- Los valores posibles pueden ser: 'usuario', 'profesional', 'admin'
```
* **Ventaja**: Es muy fácil de consultar desde React Native con Supabase JS y de gestionar directamente desde el panel web de Supabase.
* **Control en la App**:
  Al iniciar sesión, consultas el perfil del usuario:
  ```typescript
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (perfil?.rol === 'admin') {
    // Desbloquear privilegios o redirigir a rutas de admin
  }
  ```

### Opción B: Metadatos del Usuario (App Metadata)
Puedes usar las funciones de Supabase (`auth.users`) para asignar metadatos que van en el JWT:
* Desde la consola SQL de Supabase, puedes actualizar la columna `raw_app_meta_data` en el esquema `auth.users`:
  ```sql
  UPDATE auth.users 
  SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"admin"') 
  WHERE email = 'admin@lechambea.com';
  ```
* En la aplicación React Native, puedes leerlo directamente del objeto `user` retornado por `supabase.auth.getUser()`:
  ```typescript
  const role = user.app_metadata?.role; // 'admin'
  ```

---

## 2. Estructura de Directorios

Para mantener el patrón arquitectónico **MVC (Model-View-Controller)** del proyecto, cuando implementes las vistas del administrador debes organizarlas así:

* `/views`: Pantallas de administración (ej. `DashboardAdminScreen.tsx`, `UserManagementScreen.tsx`, `ReportListScreen.tsx`).
* `/controllers`: Hooks de React (`useAdminController.ts`) que contengan la lógica de negocio para interactuar con la API/Base de datos.
* `/models`: Definición de tipos de datos específicos de la administración (`admin.types.ts`).
