import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { communitySchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = communitySchema.parse(await req.json());
  const community = await prisma.community.create({ data });

  await logAudit({ user, action: "CREATE_COMMUNITY", entityType: "Community", entityId: community.id });

  return NextResponse.json(community, { status: 201 });
});
