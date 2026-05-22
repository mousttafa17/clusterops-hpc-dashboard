export type UserRole = "user" | "admin";

export type User = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type AuthResponse =
  | AuthPayload
  | {
      success?: boolean;
      message?: string;
      data: AuthPayload;
    };