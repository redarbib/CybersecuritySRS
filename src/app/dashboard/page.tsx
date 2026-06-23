import "../globals.css";
import DashboardCard from "../components/dashboardCard";
import FormLanding from "../components/formUpload";
import { getSessionFromServerCookies } from "../../../lib/authSession";
type DashboardSearchParams = {
  q?: string | string[];
};

type DashboardPageProps = {
  searchParams?: Promise<DashboardSearchParams> | DashboardSearchParams;
};

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  // Use session to fetch email
  const session = await getSessionFromServerCookies();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedSearchQuery = getSingleSearchParam(resolvedSearchParams?.q);
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
          searchQuery={requestedSearchQuery ?? ""}
        />
      </section>
    </main>
  );
}
