import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "../../../../lib/db";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "../../../../lib/authSession";

type UserRow = {
  Id: number;
  Email: string;
  PasswordHash: string;
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required.", returnedStatus: 400 },
        { status: 400 },
      );
    }

    const [rows] = await pool.execute(
      `SELECT Id, Email, PasswordHash
       FROM users
       WHERE Email = ?
       LIMIT 1`,
      [email],
    );

    const users = rows as UserRow[];
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password.", returnedStatus: 401 },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password.", returnedStatus: 401 },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        userId: user.Id,
        email: user.Email,
      },
      { status: 200 },
    );

    response.cookies.set(
      AUTH_SESSION_COOKIE,
      createSessionToken({ userId: user.Id, email: user.Email }),
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
    return NextResponse.json(
      { message: "Login failed. Please try again.", returnedStatus: 500 },
      { status: 500 },
    );
  }
}
