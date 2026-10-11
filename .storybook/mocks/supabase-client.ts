type AuthResult = Promise<{ error: Error | null }>;
type AuthMock = () => AuthResult;

function ok(): AuthResult {
  return Promise.resolve({ error: null });
}

let resetPasswordForEmailMock: AuthMock = ok;

export function resetSupabaseClientMocks() {
  resetPasswordForEmailMock = ok;
}

export function setResetPasswordForEmailMock(mock: AuthMock) {
  resetPasswordForEmailMock = mock;
}

export function createClient() {
  return {
    auth: {
      signInWithPassword: ok,
      signInWithOAuth: ok,
      signUp: ok,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: ok,
      signOut: ok,
      getUser: () =>
        Promise.resolve({
          data: {
            user: {
              id: "storybook-user",
              email: "demo@manpower.ai",
            },
          },
          error: null,
        }),
    },
  };
}
