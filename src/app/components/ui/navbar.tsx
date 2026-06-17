import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex w-50 items-center justify-around bg-white p-3 rounded-lg">
      
      <Link
        href="/login"
        className="text-zinc-900 hover:underline"
      >
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