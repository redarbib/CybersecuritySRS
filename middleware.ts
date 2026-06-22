import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/transfer") {
    return NextResponse.next();
  }
  const requestedFileToken = searchParams.get("file");
  if (!requestedFileToken) {
    return new NextResponse("You have no access to this.", { status: 403 });
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/transfer"],
};
