// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { User, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabaseClient";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email || "";
        const password = credentials?.password || "";

        console.log("Attempting login for:", email);

        // 🔹 Attempt to sign in user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          console.error("Auth Error:", error?.message);
          throw new Error(error?.message || "Invalid credentials");
        }

        console.log("Authenticated User ID:", data.user.id);

        // 🔹 Fetch user role and name from Supabase "users" table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_id, role, name")
          .eq("user_id", data.user.id)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user role:", userError?.message || "No user found");
          throw new Error("Failed to fetch user role");
        }

        console.log("Successfully fetched user data:", { id: data.user.id, email: data.user.email, role: userData.role });

        return {
          id: data.user.id,
          email: data.user.email,
          role: userData.role as string,
          name: userData.name as string,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true // Always use secure in production
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: true
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true
      },
    },
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      console.log("JWT Callback - Current token:", token);
      console.log("JWT Callback - User data:", user);
      
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("Session Callback - Current session:", session);
      console.log("Session Callback - Current token:", token);
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login page on error
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };