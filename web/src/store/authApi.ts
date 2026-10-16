import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { hasRole, type Role, type SessionUser } from '@/lib/auth/roles';

interface SessionResponse { user: SessionUser | null }

/** Talks to the Next.js auth routes (the BFF); the JWT itself stays in an httpOnly cookie. */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/auth' }),
  tagTypes: ['Session'],
  endpoints: (build) => ({
    getSession: build.query<SessionResponse, void>({ query: () => 'session', providesTags: ['Session'] }),
    login: build.mutation<SessionResponse, { email: string; password: string }>({
      query: (body) => ({ url: 'login', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),
    logout: build.mutation<SessionResponse, void>({ query: () => ({ url: 'logout', method: 'POST' }), invalidatesTags: ['Session'] }),
    getUsers: build.query<SessionUser[], void>({ query: () => 'users' }),
  }),
});

export const { useGetSessionQuery, useLoginMutation, useLogoutMutation, useGetUsersQuery } = authApi;

/** Current user plus a role check; `loading` is true until the first session response. */
export function useSession() {
  const { data, isLoading } = useGetSessionQuery();
  const user = data?.user ?? null;
  return { user, loading: isLoading, can: (role: Role) => hasRole(user?.role, role) };
}
