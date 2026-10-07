export type WordingTemplate = {
  id: string;
  label: { en: string; gu: string };
  text: { en: string; gu: string };
};

export const familyTemplates: WordingTemplate[] = [
  {
    id: "together",
    label: {
      en: "Together with our families · Recommended",
      gu: "પરિવાર સાથે · સૂચિત",
    },
    text: { en: "Together with our families", gu: "અમારા પરિવાર સાથે" },
  },
  {
    id: "blessings",
    label: { en: "Parents’ blessings", gu: "માતા-પિતાના આશીર્વાદ" },
    text: {
      en: "With the love and blessings of our parents",
      gu: "અમારા માતા-પિતાના પ્રેમ અને આશીર્વાદ સાથે",
    },
  },
  {
    id: "elders",
    label: { en: "Blessings of our elders", gu: "વડીલોના આશીર્વાદ" },
    text: {
      en: "With the blessings of our elders and the love of our families",
      gu: "વડીલોના આશીર્વાદ અને પરિવારના પ્રેમ સાથે",
    },
  },
  {
    id: "families-invite",
    label: {
      en: "An invitation from both families",
      gu: "બંને પરિવારોનું આમંત્રણ",
    },
    text: {
      en: "Our families warmly invite you to celebrate our wedding",
      gu: "અમારા બંને પરિવારો આપને લગ્ન સમારંભમાં હાર્દિક આમંત્રણ આપે છે",
    },
  },
  {
    id: "two-families",
    label: { en: "Two families, one celebration", gu: "બે પરિવારોનો આનંદ" },
    text: {
      en: "Two families come together to celebrate a new beginning",
      gu: "નવા જીવનની શરૂઆતની ઉજવણી માટે બે પરિવારો એક થાય છે",
    },
  },
  {
    id: "grateful",
    label: { en: "Love and gratitude", gu: "પ્રેમ અને કૃતજ્ઞતા" },
    text: {
      en: "Surrounded by the love of our families, we begin our life together",
      gu: "અમારા પરિવારના પ્રેમ સાથે અમે નવા સહજીવનની શરૂઆત કરીએ છીએ",
    },
  },
];

export const invitationTemplates: WordingTemplate[] = [
  {
    id: "warm",
    label: {
      en: "Warm and welcoming · Recommended",
      gu: "હાર્દિક આમંત્રણ · સૂચિત",
    },
    text: {
      en: "With joyful hearts, we invite you to celebrate our wedding. Your presence and blessings will make our day even more special.",
      gu: "આનંદભર્યા હૃદયે અમારા લગ્ન સમારંભમાં આપને હાર્દિક આમંત્રણ આપીએ છીએ. આપની હાજરી અને આશીર્વાદ અમારા આ પ્રસંગને વધુ યાદગાર બનાવશે.",
    },
  },
  {
    id: "traditional",
    label: {
      en: "Traditional Gujarati invitation",
      gu: "પરંપરાગત લગ્ન આમંત્રણ",
    },
    text: {
      en: "With the blessings of our elders, we request the pleasure of your company at our wedding ceremony. Please join us and bless us as we begin our married life.",
      gu: "વડીલોના આશીર્વાદ સાથે અમારા શુભ લગ્ન પ્રસંગે પધારવા આપને ભાવભર્યું આમંત્રણ પાઠવીએ છીએ. આપ સહપરિવાર પધારી અમારા નવજીવનને આશીર્વાદ આપશો.",
    },
  },
  {
    id: "simple",
    label: { en: "Short and simple", gu: "ટૂંકું અને સરળ" },
    text: {
      en: "We’re getting married! Join us with your family to celebrate our new beginning.",
      gu: "અમે લગ્નના બંધનમાં બંધાઈ રહ્યા છીએ! અમારા નવા જીવનની શરૂઆતની ઉજવણીમાં આપ સહપરિવાર જોડાશો.",
    },
  },
  {
    id: "romantic",
    label: { en: "A new chapter", gu: "નવા જીવનની શરૂઆત" },
    text: {
      en: "A beautiful new chapter begins with love. We would be delighted to have you beside us as we celebrate our wedding and the promise of a lifetime together.",
      gu: "પ્રેમ સાથે અમારા જીવનનો નવો અધ્યાય શરૂ થઈ રહ્યો છે. અમારા લગ્ન અને જીવનભરના સાથની ઉજવણીમાં આપ અમારી સાથે હશો તો અમને ખૂબ આનંદ થશે.",
    },
  },
  {
    id: "festive",
    label: {
      en: "Music, laughter, and celebration",
      gu: "સંગીત અને આનંદની ઉજવણી",
    },
    text: {
      en: "Come for the celebrations, stay for the memories. Join us for music, laughter, delicious food, and our wedding festivities with the people we love.",
      gu: "સંગીત, હાસ્ય અને સ્વાદિષ્ટ ભોજન સાથે અમારા લગ્નની ખુશીઓમાં સહભાગી થવા પધારશો. પરિવાર અને મિત્રો સાથે મળીને આ પ્રસંગને યાદગાર બનાવીએ.",
    },
  },
  {
    id: "formal",
    label: { en: "Formal family invitation", gu: "સહપરિવાર પધારવાનું આમંત્રણ" },
    text: {
      en: "Together with our families, we cordially invite you to our wedding celebrations. We look forward to welcoming you and your family on this auspicious occasion.",
      gu: "અમારા પરિવાર સાથે આપને અમારા શુભ લગ્ન સમારંભમાં સાદર આમંત્રણ પાઠવીએ છીએ. આ મંગલ પ્રસંગે આપ સહપરિવાર પધારશો એવી અમારી હાર્દિક અપેક્ષા છે.",
    },
  },
];

export const functionSuggestions = [
  { title: { en: "Grah Shanti", gu: "ગ્રહ શાંતિ" }, animation: "grah-shanti" },
  { title: { en: "Mandap Muhurat", gu: "મંડપ મુહૂર્ત" }, animation: "wedding" },
  { title: { en: "Haldi", gu: "હલ્દી" }, animation: "haldi" },
  { title: { en: "Mehendi", gu: "મહેંદી" }, animation: "mehendi" },
  { title: { en: "Sangeet", gu: "સંગીત સંધ્યા" }, animation: "sangeet" },
  { title: { en: "Carnival", gu: "કાર્નિવલ" }, animation: "carnival" },
  { title: { en: "Pool Party", gu: "પૂલ પાર્ટી" }, animation: "pool-party" },
  { title: { en: "Wedding", gu: "લગ્ન સમારંભ" }, animation: "wedding" },
  { title: { en: "Reception", gu: "સ્નેહ મિલન" }, animation: "celebration" },
] as const;
