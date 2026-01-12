export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  postalCode: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  postalCode: string;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    postalCode: user.postalCode,
  };
}
