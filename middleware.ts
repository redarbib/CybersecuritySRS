import { NextRequest, NextResponse } from "next/server";

// Middleware runs before the request reaches the route handler/page
export async function middleware(request: NextRequest) {
  // Extract pathname and query parameters from the incoming request URL
  const { pathname, searchParams } = request.nextUrl;

  // Only apply this middleware logic to the /transfer route, For all other routes, continue normally
  if (pathname !== "/transfer") {
    return NextResponse.next();
  }

  // Get the "file" query parameter from the URL
  const requestedFileToken = searchParams.get("file");

  // If no file token is provided, deny access
  if (!requestedFileToken) {
    return new NextResponse("You have no access to this.", { status: 403 });
  }

  // If the file token exists, allow the request to continue
  return NextResponse.next();
}

// Configure middleware to run only for requests matching /transfer
export const config = {
  matcher: ["/transfer"],
};
