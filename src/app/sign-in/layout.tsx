import { cookies } from "next/headers";
import { OwnerLanguage } from "@/components/owner-language";
export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerLanguage
      initial={
        (await cookies()).get("owner-language")?.value === "gu" ? "gu" : "en"
      }
    >
      {children}
    </OwnerLanguage>
  );
}
