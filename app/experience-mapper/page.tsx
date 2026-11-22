"use client";

import Navbar from "@/components/Navbar";
import ExperienceMapper from "@/components/ExperienceMapper";

export default function ExperienceMapperPage() {
  return (
    <>
      <Navbar />
      <main className="container-main py-10">
        <ExperienceMapper />
      </main>
    </>
  );
}
