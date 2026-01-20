import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      role: string;
      academicYear: number;
      status: string;
      profileImage?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    username?: string;
    role: string;
    academicYear: number;
    status: string;
    profileImage?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    username?: string;
    role: string;
    academicYear: number;
    status: string;
    profileImage?: string | null;
  }
}
