export type RegisterFormData = {
  // Paso 1: Credenciales
  correo: string;
  password: string;
  confirmPassword: string;

  // Paso 2: Datos de usuario (plantilla Editar Perfil)
  nombre: string;
  apellidos: string;
  telefono: string;
  ciudad: string;
  fecha_nacimiento: string;
  genero: string;
  foto_perfil: string | null;
};

export type RegisterSharedProps = {
  formData: RegisterFormData;
  setFormData: React.Dispatch<React.SetStateAction<RegisterFormData>>;
};

