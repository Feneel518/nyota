import {
  localizedText,
  type InvitationContent,
  type Language,
} from "@/lib/content";

export function FamilyBlessings({
  content,
  language,
}: {
  content: InvitationContent;
  language: Language;
}) {
  const text = (value: { en: string; gu: string }) =>
    localizedText(value, language, content.defaultLanguage);
  const mothers = content.motherNames
    ?.map((mother, i) => ({
      name: text(mother),
      partner: text(content.names[i]),
    }))
    .filter((mother) => mother.name);
  if (!mothers?.length) return null;
  return (
    <div className="family-blessings">
      <p>
        {language === "gu"
          ? "માતાઓના પ્રેમ અને આશીર્વાદ સાથે"
          : "With our mothers’ love and blessings"}
      </p>
      <ul>
        {mothers.map((mother, i) => (
          <li key={i}>
            {mother.name}
            {mother.partner && (
              <span>
                {" "}
                —{" "}
                {language === "gu"
                  ? `${mother.partner}નાં માતા`
                  : `mother of ${mother.partner}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
