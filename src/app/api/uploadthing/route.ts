import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Expose GET and POST handlers for Next.js route
export const { GET, POST } = createRouteHandler({
  // Attach our upload router to the route handler
  router: ourFileRouter,
});
