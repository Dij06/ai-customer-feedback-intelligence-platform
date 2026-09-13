import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany();
    return NextResponse.json(workspaces);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}