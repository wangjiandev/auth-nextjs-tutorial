import NextAuth from "next-auth";
import Github from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import db from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { loginSchema } from "@/lib/schemas";
import { v4 as uuid } from "uuid";
import { encode } from "next-auth/jwt";

const adapter = PrismaAdapter(db);

export const { auth, handlers, signIn } = NextAuth({
  adapter,
  providers: [
    Github,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedCredentials = loginSchema.parse(credentials);
        const user = await db.user.findFirst({
          where: {
            email: validatedCredentials.email,
            password: validatedCredentials.password,
          },
        });
        if (!user) {
          throw new Error("Invalid credentials");
        }
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    encode: async (params) => {
      if (params.token?.credentials) {
        const sessionToken = uuid();
        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }
        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        });
        if (!createdSession) {
          throw new Error("Failed to create session");
        }
        return sessionToken;
      }
      return encode(params);
    },
  },
});
