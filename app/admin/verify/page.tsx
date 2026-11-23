"use client";

import Navbar from "@/components/Navbar";
import AdminConsole from "@/components/AdminConsole";

export default function AdminVerifyPage() {
  return (
    <>
      <Navbar />
      <main className="container-main max-w-5xl py-10">
        <AdminConsole />
      </main>
    </>
  );
}
