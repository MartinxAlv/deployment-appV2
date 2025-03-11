// src/types/users.ts
export interface User {
    user_id: string;
    email: string;
    name: string;
    role: 'admin' | 'technician';
  }
  
  export interface SessionUser {
    id?: string;
    email?: string;
    role?: string;
  }