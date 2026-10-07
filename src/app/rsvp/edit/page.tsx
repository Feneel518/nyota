import { EditResponse } from "@/features/rsvp/edit";
export const metadata = {
  title: "Edit your response",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Edit() {
  return <EditResponse />;
}
