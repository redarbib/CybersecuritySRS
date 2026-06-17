import Button from "./button";

const formLanding = () => {
  const inputClass =
    "w-full text-black bg-transparent p-2 m-1 border-b border-black outline-none";
  return (
    <div className="flex min-h-screen items-center">
      <form className="w-full max-w-xl ml-10 mr-auto p-8 bg-white rounded-lg gap-4">
        <div className="w-full flex flex-col gap-3 mb-4">
          <div className="flex w-full gap-4">
            <label className="flex h-32 flex-1 cursor-pointer items-center justify-center rounded bg-[#5D474D] text-white">
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/plus.svg"
                  alt="Add File"
                  className="w-12 h-12 filter invert"
                />
                <span>Add File</span>
              </div>
              <input type="file" name="file" required className="hidden" />
            </label>
            <label className="flex h-32 flex-1 cursor-pointer items-center justify-center rounded bg-[#5D474D] text-white">
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/folder.svg"
                  alt="Add Folder"
                  className="w-12 h-12 filter invert"
                />
                <span>Add Folder</span>
              </div>
              <input type="file" name="folder" required className="hidden" />
            </label>
          </div>
          <input
            type="email"
            name="emailTo"
            placeholder="Email to"
            required
            className={inputClass}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="text"
            name="title"
            placeholder="Title"
            required
            className={inputClass}
          />
          <input
            type="text"
            name="message"
            placeholder="Message"
            required
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className={inputClass}
          />
        </div>
        <Button />
      </form>
    </div>
  );
};

export default formLanding;
