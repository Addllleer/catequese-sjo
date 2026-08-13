import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "LEVEL_RESPONSIBLE";
      responsibleLevelId: string | null;
      responsibleLevelSlug: string | null;
      responsibleLevelName: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "LEVEL_RESPONSIBLE";
    responsibleLevelId: string | null;
    responsibleLevelSlug: string | null;
    responsibleLevelName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "LEVEL_RESPONSIBLE";
    responsibleLevelId: string | null;
    responsibleLevelSlug: string | null;
    responsibleLevelName: string | null;
  }
}
