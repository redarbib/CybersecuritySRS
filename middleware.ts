import { NextRequest, NextResponse } from "next/server";
import { isValidSecretHash } from "./lib/secretHash";
import { getSessionFromCookieHeader } from "./lib/authSession";

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

  if (pathname !== "/transfer") {
    return NextResponse.next();
  }

  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (session) {
    return NextResponse.next();
  }

  const requestedSecretHash = searchParams.get("code");
  const requestedUserId = parseUserId(searchParams.get("userId"));
  const hasValidSecretHash = requestedSecretHash
    ? await isValidSecretHash(requestedSecretHash)
    : false;

  if (!requestedSecretHash || !hasValidSecretHash || !requestedUserId) {
    return new NextResponse("You have no access to this.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/transfer"],
};
