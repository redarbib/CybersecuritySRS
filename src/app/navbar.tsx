const Navbar = () => {
  return (
    <div className="flex w-50 justify-around bg-white p-3 rounded-lg">
      <button className="text-zinc-900 hover:cursor-pointer">Login</button>
      <button className="bg-[#4E3D42] p-3 rounded-lg text-white hover:cursor-pointer">
        {" "}
        Register
      </button>
    </div>
  );
};

export default Navbar;
