"use client";

import Navbar from "@/components/Navbar";
import PostJobForm from "@/components/PostJobForm";

export default function EmployerPostPage() {
  return (
    <>
      <Navbar />
      <div className="container-main py-8 max-w-2xl mx-auto">
        <PostJobForm />
      </div>
    </>
  );
}
