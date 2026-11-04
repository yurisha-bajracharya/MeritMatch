"use client";

import Navbar from "@/components/Navbar";
import ExperienceMapper from "@/components/ExperienceMapper";

export default function ExperienceMapperPage() {
  return (
    <>
      <Navbar />
      <div className="container-main py-8 max-w-2xl mx-auto">
        <ExperienceMapper />
      </div>
    </>
  );
}
