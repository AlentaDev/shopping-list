import type { Email, Name, PostalCode } from "@src/core/value-objects/index.js";

export type User = {
  id: string;
  name: Name;
  email: Email;
  passwordHash: string;
  postalCode: PostalCode;
};

export type PublicUser = {
  id: string;
  name: Name;
  email: Email;
  postalCode: PostalCode;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    postalCode: user.postalCode,
  };
}
