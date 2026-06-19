"use client";
import "../globals.css";
import DashboardCard from "../components/dashboardCard";
import FormLanding from "../components/formLanding";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen w-full bg-[#a99b86]">
      <section className="flex min-h-screen w-1/2 items-center justify-center px-6">
        <div className="w-full translate-x-3 translate-y-10">
          <FormLanding />
        </div>
      </section>

      <section className="min-h-screen w-1/2">
        <DashboardCard />
      </section>
    </main>
  );
}
