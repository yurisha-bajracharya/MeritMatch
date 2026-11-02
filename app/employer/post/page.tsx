import PostJobForm from "@/components/PostJobForm";
import { TEMPLATES, toPublicTemplate } from "@/lib/templates";

export default function PostJobPage() {
  const templates = Object.values(TEMPLATES).map(toPublicTemplate);
  return <PostJobForm templates={templates} />;
}
