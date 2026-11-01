import Link from "next/link";
import Stamp from "@/components/Stamp";

export default function Home() {
  return (
    <main>
      <header className="flex items-center justify-between py-5">
        <span className="font-semibold text-brand">MeritMatch</span>
        <Stamp size={56} center="OK" label="PROOF OVER NETWORKS" tilt={6} />
      </header>

      <section className="border-t border-rule pt-10 pb-8">
        <h1 className="font-display text-4xl leading-tight text-brand">
          Show the work. Skip the connections.
        </h1>
        <p className="mt-4 text-lg">
          Candidates complete a short, real task. Employers see scored answers,
          with names hidden until the candidate says yes.
        </p>
      </section>

      <section className="border-t border-rule">
        <Link
          href="/employer/post"
          className="ledger-row flex items-center justify-between"
        >
          <span>
            <span className="block font-semibold">I am hiring</span>
            <span className="block text-sm opacity-75">
              Post a job, get a ranked shortlist
            </span>
          </span>
          <span aria-hidden>&rarr;</span>
        </Link>
        <Link
          href="/translator"
          className="ledger-row flex items-center justify-between"
        >
          <span>
            <span className="block font-semibold">I am looking for work</span>
            <span className="block text-sm opacity-75">
              Turn what you have done into skills
            </span>
          </span>
          <span aria-hidden>&rarr;</span>
        </Link>
        <div className="border-t border-rule" />
      </section>
    </main>
  );
}
