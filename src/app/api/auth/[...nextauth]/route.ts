// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabaseClient";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

const authOptions = {
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
          .select("user_id, role, name") // Added name to the selected fields
          .eq("user_id", data.user.id)
          .single();

        // 🔹 Debugging Logs
        console.log("User Data from DB:", userData);
        console.log("Error from DB Query:", userError);

        if (userError || !userData) {
          console.error("Error fetching user role:", userError?.message || "No user found");
          throw new Error("Failed to fetch user role");
        }

        // ✅ Return session with user role and name included
        return {
          id: data.user.id,
          email: data.user.email,
          role: userData.role,
          name: userData.name, // Include name in session
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  // Add session configuration for persistence
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Configure secure cookies
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
  async session({ session, token }: { session: Session; token: JWT }) {
    console.log("Session callback - Token:", token);
    
    if (session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.name = token.name as string;
    }
    
    return session;
  },
async jwt({ token, user }: { token: JWT; user?: User }) {
        console.log("JWT callback - User:", user);
    
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.name = user.name;
    }
    
    return token;
  },
},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };