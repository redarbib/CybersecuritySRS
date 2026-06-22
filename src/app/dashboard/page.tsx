import "../globals.css";
import DashboardCard from "../components/dashboardCard";
import FormLanding from "../components/formUpload";
import { getSessionFromServerCookies } from "../../../lib/authSession";

export default async function DashboardPage() {
  // Use session to fetch email
  const session = await getSessionFromServerCookies();
  return (
    <main className="flex min-h-screen w-full">
      <section className="flex min-h-screen w-1/2 items-center justify-center">
        <div className="w-full">
          <FormLanding isLoggedIn={Boolean(session)} />
        </div>
      </section>

      <section className="min-h-screen w-1/2">
        <DashboardCard
          email={session?.email ?? null}
          userId={session?.userId ?? null}
        />
      </section>
    </main>
  );
}
