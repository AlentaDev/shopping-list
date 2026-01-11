export type AuthResponseDto = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type AuthSession = {
  token: string;
  userId: string;
  userName: string;
  email: string;
};

const toAuthSession = (response: AuthResponseDto): AuthSession => ({
  token: response.token,
  userId: response.user.id,
  userName: response.user.name,
  email: response.user.email,
});

export { toAuthSession };
