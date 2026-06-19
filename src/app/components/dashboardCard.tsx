import Image from "next/image";

const DashboardCard = () => {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="min-h-screen w-full border-l border-[#d4d4d4] bg-white text-black">
        <nav className="grid grid-cols-2 border-b border-[#dddddd] p-3">
          <div className="flex h-12 items-center justify-center rounded-l-md border border-[#d8d8d8] bg-white text-[22px] leading-none">
            Dashboard
          </div>
          <div className="-ml-px flex h-12 items-center justify-center rounded-r-md border border-[#d8d8d8] bg-white text-[22px] leading-none">
            user.email
          </div>
        </nav>

        <div className="px-4 pt-6">
          <h1 className="mb-3 text-[24px] leading-7">
            Hello, <span className="font-light text-[#666666]">user.email</span>
          </h1>

          <label className="flex h-10 items-center gap-2 rounded-md border border-[#d6d6d6] px-3">
            <Image
              src="/search.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by title"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black"
            />
          </label>

          <h2 className="mt-3 text-lg leading-6">Dashboard</h2>

          <article className="mt-1 flex min-h-16 items-center justify-between rounded-md border border-[#d6d6d6] px-3 py-2">
            <div className="min-w-0">
              <h3 className="truncate text-[24px] leading-7">
                Filenaam.type
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-[#666666]">
                <span>Made 1 second ago</span>
                <span>1 MB(1 file)</span>
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-black"
                >
                  Delete transfer
                </button>
              </div>
            </div>
          </article>
        </div>
      </aside>
    </div>
  );
};

export default DashboardCard;
