import Link from "next/link";
import { getSessionFromServerCookies } from "../../../../lib/authSession";
import { deleteSessionFromServerCookie } from "../../../../lib/authSession";
import { redirect } from "next/navigation";

// Logout function
export async function logout() {
  "use server";

  // Await function to delete cookie from authSession
  await deleteSessionFromServerCookie();
  redirect("/");
}

const Navbar = async () => {
  // Use this function to determine if an user is in an session
  const session = await getSessionFromServerCookies();

  // If an user is in an session return this page
  if (session) {
    return (
      <div className="flex w-fit max-w-[500px] items-center justify-center gap-3 bg-white p-3 rounded-lg">
        <Link href="/dashboard" className="text-zinc-900">
          Dashboard
        </Link>

        <span className="text-zinc-900 font-medium truncate">
          {session.email}
        </span>

        <form action={logout}>
          <button
            type="submit"
            className="text-sm rounded-lg bg-[#4E3D42] p-3 text-white active:bg-[#3A2C30] hover:bg-[#3A2C30]"
          >
            Logout
          </button>
        </form>
      </div>
    );
  }

  // If an user is not in an session return this page
  return (
    <div className="flex w-50 items-center justify-around bg-white p-3 rounded-lg">
      <Link href="/login" className="text-zinc-900 hover:underline">
        Login
      </Link>

      <Link
        href="/register"
        className="bg-[#4E3D42] px-4 py-2 rounded-lg text-white hover:bg-[#3f3135] transition"
      >
        Register
      </Link>
    </div>
  );
};

export default Navbar;
