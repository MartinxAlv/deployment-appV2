// src/types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
  }

  interface Session {
    user?: User & {
      id?: string;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}