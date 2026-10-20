import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RegisterWelcome from "./views/RegisterWelcome";
import RegisterUsers from "./views/RegisterUsers";
import RegisterAuth from "./views/RegisterAuth";
import RegisterSuccess from "./views/RegisterSuccess";

import type { RegisterStackParamList } from "../../core/navigation/types";
import type { RegisterFormData } from "./models/register.types";

const Stack = createNativeStackNavigator<RegisterStackParamList>();

export default function RegisterNavigator() {
  const [formData, setFormData] = useState<RegisterFormData>({
    correo: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    ciudad: "",
    fecha_nacimiento: "",
    genero: "",
    foto_perfil: null,
  });

  return (
    <Stack.Navigator
      id="RegisterStack"
      initialRouteName="RegisterWelcome"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="RegisterWelcome">
        {(props) => <RegisterWelcome {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterUsers">
        {(props) => <RegisterUsers {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterAuth">
        {(props) => <RegisterAuth {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen
        name="RegisterSuccess"
        options={{ animation: "fade" }}
        component={RegisterSuccess}
      />
    </Stack.Navigator>
  );
}

