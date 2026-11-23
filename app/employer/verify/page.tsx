"use client";

import Navbar from "@/components/Navbar";
import EmployerVerification from "@/components/EmployerVerification";

export default function EmployerVerifyPage() {
  return (
    <>
      <Navbar />
      <main className="container-main max-w-4xl py-10">
        <EmployerVerification />
      </main>
    </>
  );
}
