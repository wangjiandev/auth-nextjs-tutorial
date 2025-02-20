import { executeAction } from "@/lib/executeAction";
import { loginSchema } from "@/lib/schemas";
import db from "@/lib/db";

const signUp = async (formData: FormData) => {
  return executeAction({
    actionFn: async () => {
      const email = formData.get("email");
      const password = formData.get("password");
      const validatedData = loginSchema.parse({ email, password });
      await db.user.create({
        data: {
          email: validatedData.email,
          password: validatedData.password,
        },
      });
    },
  });
};

export { signUp };
