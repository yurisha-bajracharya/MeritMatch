"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import HireRecord from "@/components/HireRecord";

function Inner() {
  const { id } = useParams() as { id: string };
  const k = useSearchParams().get("k") ?? "";
  return <HireRecord hireId={id} k={k} />;
}

export default function HirePage() {
  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="container-main max-w-3xl py-10 print:py-0">
        <Suspense fallback={null}>
          <Inner />
        </Suspense>
      </main>
    </>
  );
}
