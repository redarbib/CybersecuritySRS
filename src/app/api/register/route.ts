import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { ResultSetHeader } from "mysql2";
import { z } from "zod";
import pool from "../../../../lib/db";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "../../../../lib/authSession";
const registerRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(255, "Email can contain at most 255 characters."),
  password: z
    .string()
    .min(1, "Password is required.")
    .max(255, "Password can contain at most 255 characters."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedRequest = registerRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      const firstIssue = parsedRequest.error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Invalid registration request." },
        { status: 400 },
      );
    }
    const { email, password } = parsedRequest.data;

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (Username, Email, PasswordHash)
       VALUES (?, ?, ?)`,
      [email, email, passwordHash],
    );

    if (!result.insertId) {
      return NextResponse.json(
        { message: "Registration failed." },
        { status: 500 },
      );
    }

    const userId = Number(result.insertId);
    const response = NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 },
    );

    response.cookies.set(
      AUTH_SESSION_COOKIE,
      createSessionToken({ userId, email }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
      },
    );

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown registration error.";

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "production"
            ? "Registration failed."
            : `Registration failed: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
