import Navbar from "./components/ui/navbar";
import FormLanding from "./components/formLanding";
import { getSessionFromServerCookies } from "../../lib/authSession";

export default async function UploadFilePage() {
  const session = await getSessionFromServerCookies();
  return (
    <div className="h-screen flex flex-col">
      <div className="w-full flex justify-end px-12 pt-4 shrink-0">
        <Navbar />
      </div>

      <div className="flex flex-1 items-center gap-12 px-12 overflow-hidden">
        <div className="w-1/2 flex justify-center items-center">
          <FormLanding isLoggedIn={Boolean(session)} />
        </div>

        <div className="w-1/2 flex justify-center items-center">
          <div className="text-center">
            <h1 className="font-extrabold text-6xl text-zinc-900 text-left">
              <span>Serious Files</span>
              <br />
              <span>Secured Transfers</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
