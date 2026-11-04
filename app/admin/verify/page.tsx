"use client";

import Navbar from "@/components/Navbar";
import VerifyList from "@/components/VerifyList";

export default function AdminVerifyPage() {
  return (
    <>
      <Navbar />
      <div className="container-main py-8 max-w-2xl mx-auto">
        <VerifyList />
      </div>
    </>
  );
}
