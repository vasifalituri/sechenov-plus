import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername || !credentials?.password) {
          throw new Error('Введите email/username и пароль');
        }

        // Check if input is email or username
        const isEmail = credentials.emailOrUsername.includes('@');
        
        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: credentials.emailOrUsername }
            : { username: credentials.emailOrUsername },
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            password: true,
            role: true,
            academicYear: true,
            status: true,
            profileImage: true,
          },
        });

        if (!user) {
          throw new Error('Пользователь не найден');
        }

        if (user.status === 'REJECTED') {
          throw new Error('Ваша заявка была отклонена');
        }

        if (user.status === 'PENDING') {
          throw new Error('Ваша заявка ожидает одобрения администратором');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Неверный пароль');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          username: user.username || undefined,
          role: user.role,
          academicYear: user.academicYear,
          status: user.status,
          profileImage: user.profileImage || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.academicYear = user.academicYear;
        token.status = user.status;
        token.profileImage = user.profileImage;
      }
      // Update token on session update
      if (trigger === 'update' && session?.profileImage !== undefined) {
        token.profileImage = session.profileImage;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.academicYear = token.academicYear as number;
        session.user.status = token.status as string;
        session.user.profileImage = token.profileImage as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
