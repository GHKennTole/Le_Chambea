export type RegisterFormData = {
  name: string;
  lastName: string;
  birthDate: string;
  genero: string;
  correo: string;
  password: string;
  confirmPassword: string;
};

export type RegisterSharedProps = {
  formData: RegisterFormData;
  setFormData: React.Dispatch<React.SetStateAction<RegisterFormData>>;
};
