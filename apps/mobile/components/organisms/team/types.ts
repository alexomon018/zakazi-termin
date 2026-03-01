export type Member = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  salonName: string | null;
  role: string;
  joinedAt: Date;
};

export type Invite = {
  inviteUrl: string;
  email: string | null;
  role: string | null;
  expiresAt: Date;
  createdAt: Date;
  isGeneralLink: boolean;
};
