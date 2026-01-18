export type RefreshTokenRecord = {
  token: string;
  userId: string;
  fingerprint: string;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
};
