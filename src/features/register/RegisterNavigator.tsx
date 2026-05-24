import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RegisterWelcome from "./views/RegisterWelcome";
import RegisterName from "./views/RegisterName";
import RegisterBirth from "./views/RegisterBirth";
import RegisterGender from "./views/RegisterGender";
import RegisterAuth from "./views/RegisterAuth";
import RegisterSuccess from "./views/RegisterSuccess";

import type { RegisterStackParamList } from "../../core/navigation/types";
import type { RegisterFormData } from "./models/register.types";

const Stack = createNativeStackNavigator<RegisterStackParamList>();

export default function RegisterNavigator() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    lastName: "",
    birthDate: "",
    genero: "",
    correo: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <Stack.Navigator id="RegisterStack" screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="RegisterWelcome">
        {(props) => <RegisterWelcome {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterName">
        {(props) => <RegisterName {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterBirth">
        {(props) => <RegisterBirth {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterGender">
        {(props) => <RegisterGender {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterAuth" options={{ animation: "fade" }}>
        {(props) => <RegisterAuth {...props} formData={formData} setFormData={setFormData} />}
      </Stack.Screen>

      <Stack.Screen name="RegisterSuccess" options={{ animation: "fade" }} component={RegisterSuccess} />
    </Stack.Navigator>
  );
}
