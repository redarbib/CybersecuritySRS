import { NextRequest, NextResponse } from "next/server";
import { isValidSecretHash } from "./lib/secretHash";

const CURRENT_USER_ID = 1;

function parseUserId(rawUserId: string | null): number | null {
  if (!rawUserId) {
    return null;
  }

  const parsedValue = Number(rawUserId);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname !== "/download") {
    return NextResponse.next();
  }

  const requestedSecretHash = searchParams.get("code");
  const hasValidSecretHash = await isValidSecretHash(requestedSecretHash);
  const requestedUserId = parseUserId(searchParams.get("userId"));

  if (
    !requestedSecretHash ||
    !hasValidSecretHash ||
    !requestedUserId ||
    requestedUserId !== CURRENT_USER_ID
  ) {
    return new NextResponse("You have no access to this.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/download"],
};
