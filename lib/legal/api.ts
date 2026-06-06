import { LegalQuery, LegalResult, LegalLaw } from "./types";

const LEGAL_API_BASE_URL = "http://127.0.0.1:8000/api/rag";

/**
 * Helper to generate mock data if the backend RAG server is offline.
 */
function getMockLegalResult(description: string, language: "en" | "si"): LegalResult {
  const text = description.toLowerCase();
  
  // Categorize based on keywords
  let category: "physical abuse" | "sexual abuse" | "digital abuse" | "neglect" | "trafficking" | "general abuse" = "general abuse";
  
  if (text.includes("hit") || text.includes("beat") || text.includes("physical") || text.includes("hurt") || text.includes("slap") || text.includes("pahara") || text.includes("gahala") || text.includes("rideddi")) {
    category = "physical abuse";
  } else if (text.includes("touch") || text.includes("sexual") || text.includes("bad touch") || text.includes("assault") || text.includes("harass") || text.includes("lingika")) {
    category = "sexual abuse";
  } else if (text.includes("online") || text.includes("internet") || text.includes("facebook") || text.includes("whatsapp") || text.includes("photo") || text.includes("video") || text.includes("share") || text.includes("chat") || text.includes("rupatha")) {
    category = "digital abuse";
  } else if (text.includes("leave") || text.includes("neglect") || text.includes("abandon") || text.includes("food") || text.includes("care") || text.includes("starve") || text.includes("noleka")) {
    category = "neglect";
  } else if (text.includes("sell") || text.includes("traffic") || text.includes("force") || text.includes("work") || text.includes("money") || text.includes("jawara")) {
    category = "trafficking";
  }

  // Pre-configured Sri Lankan child protection legal databases
  const lawsDatabase: Record<string, { category_en: string; category_si: string; laws: LegalLaw[]; roadmap: string[]; roadmap_si: string[] }> = {
    "physical abuse": {
      category_en: "Physical Abuse",
      category_si: "ශාරීරික අපයෝජනය",
      laws: [
        {
          section: "308A",
          law_name: "Sri Lanka Penal Code",
          law_type: "primary",
          title: "Cruelty to Children",
          title_en: "Cruelty to Children",
          title_si: "ළමයින්ට කෲරත්වය දැක්වීම",
          simple_explanation: "Whoever having the charge or care of a child under 18 years willfully assaults, ill-treats, neglects or abandons such child in a manner likely to cause unnecessary suffering or injury to health commits a punishable offense.",
          simple_explanation_en: "Whoever having the charge or care of a child under 18 years willfully assaults, ill-treats, neglects or abandons such child in a manner likely to cause unnecessary suffering or injury to health commits a punishable offense.",
          simple_explanation_si: "වයස අවුරුදු 18ට අඩු ළමයෙකු රැකබලා ගන්නා අයෙකු එම දරුවාට හිතාමතාම පහරදීම, හිංසා කිරීම, නොසලකා හැරීම හෝ අත්හැර දැමීම දඬුවම් ලැබිය හැකි බරපතළ වරදකි.",
          reporting_guidance: "Take the child to a hospital for immediate medical checkup. Keep records of physical evidence and file a complaint to NCPA or Police Child Desk.",
          reporting_guidance_en: "Take the child to a hospital for immediate medical checkup. Keep records of physical evidence and file a complaint to NCPA or Police Child Desk.",
          reporting_guidance_si: "වහාම වෛද්‍ය පරීක්ෂණයක් සඳහා දරුවා රෝහල වෙත රැගෙන යන්න. ශාරීරික තුවාල පිළිබඳ සටහන් තබාගෙන NCPA හෝ පොලිසියේ ළමා අංශයට පැමිණිලි කරන්න."
        },
        {
          section: "33",
          law_name: "National Child Protection Authority Act, No. 50 of 1998",
          law_type: "supporting",
          title: "Power to Enter and Inspect Premises",
          title_en: "Power to Enter and Inspect Premises",
          title_si: "පරිශ්‍රයන්ට ඇතුල්වීමේ සහ පරීක්ෂා කිරීමේ බලය",
          simple_explanation: "Authorized NCPA officers have the legal power of peace officers (police) to enter and search any home, school, or building if they believe a child is being abused inside.",
          simple_explanation_en: "Authorized NCPA officers have the legal power of peace officers (police) to enter and search any home, school, or building if they believe a child is being abused inside.",
          simple_explanation_si: "කිසියම් නිවසක්, පාසලක් හෝ ගොඩනැගිල්ලක් තුළ දරුවෙකු අපයෝජනයට ලක්වන බව විශ්වාස කරන්නේ නම්, එහි ඇතුළු වී පරීක්ෂා කිරීමට බලයලත් NCPA නිලධාරීන්ට සාම නිලධාරීන්ගේ (පොලිස්) නීතිමය බලය ඇත.",
          reporting_guidance: "If a child is locked up or being abused in a specific home or center, report immediately. NCPA officers can legally enter and inspect the premises to rescue the child.",
          reporting_guidance_en: "If a child is locked up or being abused in a specific home or center, report immediately. NCPA officers can legally enter and inspect the premises to rescue the child.",
          reporting_guidance_si: "දරුවෙකු නිවසක හෝ මධ්‍යස්ථානයක කොටු වී හෝ අපයෝජනයට ලක්වන්නේ නම් වහාම වාර්තා කරන්න. දරුවා බේරා ගැනීම සඳහා එම පරිශ්‍රයට ඇතුළු වී පරීක්ෂා කිරීමට NCPA නිලධාරීන්ට නීත්‍යානුකූලව බලය ඇත."
        }
      ],
      roadmap: [
        "1. Ensure Safety: Move the child to a safe place away from the abuser.",
        "2. Medical Assistance: Take the child to a government hospital for a medical checkup and obtain a JMO report.",
        "3. Report Incident: Report to NCPA or the local police station.",
        "4. Immediate Intervention: In emergency cases, authorized officers can enter premises to rescue the child under S33 NCPA Act.",
        "5. Psychological Support & Follow Up: Arrange counseling for the child and follow up on safety measures."
      ],
      roadmap_si: [
        "1. ආරක්ෂාව තහවුරු කරන්න: දරුවාව අපයෝජකයාගෙන් ඉවත් කර ආරක්ෂිත ස්ථානයකට ගෙන යන්න.",
        "2. වෛද්‍ය ආධාර: වෛද්‍ය වාර්තාවක් (JMO) සඳහා දරුවා රජයේ රෝහලකට ඇතුළත් කරන්න.",
        "3. සිද්ධිය වාර්තා කරන්න: ළඟම ඇති පොලිසියට හෝ NCPA වෙත සිද්ධිය වාර්තා කරන්න.",
        "4. ක්ෂණික මැදිහත්වීම: NCPA පනතේ 33 වගන්තිය යටතේ දරුවා බේරා ගැනීමට පරිශ්‍රයන්ට ඇතුළු වීමට බලයලත් නිලධාරීන්ට හැකිය.",
        "5. මානසික සහාය සහ පසු විපරම්: දරුවාට මනෝවිද්‍යාත්මක උපදේශන ලබා දී ආරක්ෂක පියවරයන් පසු විපරම් කරන්න."
      ]
    },
    "sexual abuse": {
      category_en: "Sexual Abuse",
      category_si: "ලිංගික අපයෝජනය",
      laws: [
        {
          section: "363",
          law_name: "Sri Lanka Penal Code",
          law_type: "primary",
          title: "Statutory Rape & Sexual Exploitation",
          title_en: "Statutory Rape & Sexual Exploitation",
          title_si: "ලිංගික අපයෝජනය සහ ස්ත්‍රී දූෂණය",
          simple_explanation: "Any sexual act with a child under the age of 16, with or without consent, constitutes statutory rape under Sri Lankan law and carries a minimum mandatory imprisonment sentence.",
          simple_explanation_en: "Any sexual act with a child under the age of 16, with or without consent, constitutes statutory rape under Sri Lankan law and carries a minimum mandatory imprisonment sentence.",
          simple_explanation_si: "වයස අවුරුදු 16ට අඩු ළමයෙකු සමඟ කැමැත්ත ඇතිව හෝ නැතිව සිදුකරන ඕනෑම ලිංගික ක්‍රියාවක් දණ්ඩ නීති සංග්‍රහය යටතේ බරපතළ වරදක් වන අතර අවම අනිවාර්ය සිරදඬුවම් හිමිවේ.",
          reporting_guidance: "Do not wash the child or change their clothes before the medical examination to preserve DNA and physical evidence. Report immediately to 1929.",
          reporting_guidance_en: "Do not wash the child or change their clothes before the medical examination to preserve DNA and physical evidence. Report immediately to 1929.",
          reporting_guidance_si: "ඩී.එන්.ඒ. සහ අනෙකුත් භෞතික සාක්ෂි සුරක්ෂිතව තබා ගැනීම සඳහා වෛද්‍ය පරීක්ෂණයට පෙර දරුවා සේදීම හෝ ඇඳුම් මාරු කිරීම නොකරන්න. වහාම 1929 අමතන්න."
        }
      ],
      roadmap: [
        "1. Immediate Protection: Protect the child from further contact with the perpetrator.",
        "2. Medical Preservation: Do not clean the child; take them directly to a government hospital.",
        "3. Lodge Complaint: Report to NCPA or Police Child Desk.",
        "4. Legal Counseling: Seek assistance from legal aid services specializing in child abuse.",
        "5. Long-term Rehabilitation: Provide therapy and support to ensure child safety and recovery."
      ],
      roadmap_si: [
        "1. ක්ෂණික ආරක්ෂාව: වහාම දරුවා අපරාධකරුගෙන් වෙන් කර ආරක්ෂා කරන්න.",
        "2. සාක්ෂි සුරැකීම: දරුවාව පිරිසිදු නොකර සෘජුවම රජයේ රෝහලක අධිකරණ වෛද්‍යවරයා (JMO) වෙත රැගෙන යන්න.",
        "3. පැමිණිල්ල ඉදිරිපත් කිරීම: පොලිසියේ ළමා අංශයට හෝ NCPA වෙත පැමිණිලි කරන්න.",
        "4. නීති උපදේශනය: ළමා අපයෝජන නඩු සඳහා විශේෂඥ නීති ආධාර සේවාවන්හි සහාය ලබා ගන්න.",
        "5. දිගුකාලීන පුනරුත්ථාපනය: දරුවාගේ සුවය ලැබීම සඳහා දිගුකාලීන ප්‍රතිකාර සහ චිකිත්සක සහාය ලබා දෙන්න."
      ]
    },
    "digital abuse": {
      category_en: "Digital & Online Abuse",
      category_si: "ඩිජිටල් සහ මාර්ගගත අපයෝජනය",
      laws: [
        {
          section: "24 of 2007",
          law_name: "Computer Crimes Act No. 24 of 2007",
          law_type: "primary",
          title: "Online Harassment & Cyber Exploitation",
          title_en: "Online Harassment & Cyber Exploitation",
          title_si: "අන්තර්ජාලය හරහා සිදුවන හිංසනය සහ අපයෝජනය",
          simple_explanation: "Publishing, distributing or transmitting obscene material involving minors online, or cyberbullying and harassing children via social media, is strictly illegal and subject to severe fines and imprisonment.",
          simple_explanation_en: "Publishing, distributing or transmitting obscene material involving minors online, or cyberbullying and harassing children via social media, is strictly illegal and subject to severe fines and imprisonment.",
          simple_explanation_si: "ළමයින් සම්බන්ධ අසභ්‍ය ද්‍රව්‍ය අන්තර්ජාලය හරහා ප්‍රකාශ කිරීම, බෙදා හැරීම හෝ සමාජ මාධ්‍ය ඔස්සේ දරුවන්ට හිංසා කිරීම සම්පූර්ණයෙන්ම තහනම් වන අතර සිරදඬුවම් ලැබිය හැකි වරදකි.",
          reporting_guidance: "Take screenshots of the online conversations, profiles, and media. Do not delete the account data. Report to Sri Lanka CERT (0112 691 692) or NCPA.",
          reporting_guidance_en: "Take screenshots of the online conversations, profiles, and media. Do not delete the account data. Report to Sri Lanka CERT (0112 691 692) or NCPA.",
          reporting_guidance_si: "අදාළ වෙබ් පිටු, ගිණුම් විස්තර සහ මැසේජ් වල ස්ක්‍රීන්ෂොට් (Screenshots) ලබා ගන්න. සාක්ෂි මකා නොදමා වහාම NCPA හෝ CERT ආයතනයට වාර්තා කරන්න."
        }
      ],
      roadmap: [
        "1. Evidence Collection: Screenshot all evidence, chat logs, URLs and profiles.",
        "2. Block & Secure: Block the perpetrator and secure the child's online accounts.",
        "3. Local CERT Reporting: Report to Sri Lanka CERT and local cyber crime division.",
        "4. Notify NCPA: Contact the NCPA to get legal and psychosocial child support.",
        "5. Counsel & Support: Monitor child's device usage and guide them through digital safety rules."
      ],
      roadmap_si: [
        "1. සාක්ෂි එකතු කිරීම: සංවාද, ගිණුම් විස්තර සහ පින්තූරවල ස්ක්‍රීන්ෂොට් සුරක්ෂිත කර ගන්න.",
        "2. අවහිර කිරීම (Block): අදාළ පුද්ගලයා අවහිර කර දරුවාගේ ගිණුම්වල ආරක්ෂාව තහවුරු කරන්න.",
        "3. CERT ආයතනයට පැමිණිලි කිරීම: ශ්‍රී ලංකා CERT ආයතනයට හෝ සයිබර් අපරාධ අංශයට වාර්තා කරන්න.",
        "4. NCPA දැනුවත් කිරීම: නීතිමය උපදෙස් සහ මනෝවිද්‍යාත්මක සහාය ලබා ගැනීමට NCPA දැනුවත් කරන්න.",
        "5. ඩිජිටල් ආරක්ෂාව: දරුවාගේ අන්තර්ජාල භාවිතය නිරීක්ෂණය කර ආරක්ෂිත ක්‍රමවේද කියා දෙන්න."
      ]
    },
    "neglect": {
      category_en: "Child Neglect",
      category_si: "ළමා නොසලකා හැරීම",
      laws: [
        {
          section: "308A",
          law_name: "Sri Lanka Penal Code",
          law_type: "primary",
          title: "Neglect of Minor",
          title_en: "Neglect of Minor",
          title_si: "ළමයින් නොසලකා හැරීම",
          simple_explanation: "Failing to provide adequate food, clothing, medical aid or shelter to a child by parents or legal guardians is a criminal offense under Sri Lankan child welfare laws.",
          simple_explanation_en: "Failing to provide adequate food, clothing, medical aid or shelter to a child by parents or legal guardians is a criminal offense under Sri Lankan child welfare laws.",
          simple_explanation_si: "මව්පියන් හෝ භාරකරුවන් විසින් දරුවෙකුට ප්‍රමාණවත් ආහාර, ඇඳුම් පැළඳුම්, නවාතැන් හෝ වෛද්‍ය ප්‍රතිකාර ලබා නොදීම දඬුවම් ලැබිය හැකි අපරාධ වරදකි.",
          reporting_guidance: "Document instances of neglect (lack of food, school dropout, unsafe environment). Inform probation officers or call the NCPA helpline on 1929.",
          reporting_guidance_en: "Document instances of neglect (lack of food, school dropout, unsafe environment). Inform probation officers or call the NCPA helpline on 1929.",
          reporting_guidance_si: "නොසලකා හැරීම පිළිබඳ තොරතුරු (ආහාර නොලැබීම, පාසල් නොයැවීම) ලේඛනගත කරන්න. පරිවාස නිලධාරීන්ට හෝ 1929 අංකයට දැනුම් දෙන්න."
        }
      ],
      roadmap: [
        "1. Identify Needs: Verify the immediate basic needs of the child (food, health).",
        "2. Inform Authorities: Contact the local Grama Niladhari or Probation Officer.",
        "3. Report to NCPA: Report to the NCPA to initiate child safety and family assessment.",
        "4. Rehabilitation Support: Connect the family with social welfare services.",
        "5. Safe Guardianship: If necessary, place the child in temporary child care home or foster care."
      ],
      roadmap_si: [
        "1. අවශ්‍යතා හඳුනා ගැනීම: දරුවාගේ මූලික අවශ්‍යතා (ආහාර, සෞඛ්‍ය) පිළිබඳව සොයා බලන්න.",
        "2. බලධාරීන් දැනුවත් කිරීම: ප්‍රාදේශීය ග්‍රාම නිලධාරී හෝ පරිවාස නිලධාරීවරයා දැනුවත් කරන්න.",
        "3. NCPA ඇමතීම: දරුවාගේ ආරක්ෂාව සහ පවුල් තත්ත්වය පරීක්ෂා කිරීම සඳහා NCPA වෙත වාර්තා කරන්න.",
        "4. සුබසාධන සේවා: අදාළ පවුලට ආර්ථික හෝ සුබසාධන ආධාර ලබා දීමට මැදිහත් වන්න.",
        "5. ආරක්ෂිත රැකවරණය: අවශ්‍යතාවය පරිදි පරිවාස නියෝග මත දරුවාට තාවකාලික ආරක්ෂිත රැකවරණයක් සපයන්න."
      ]
    },
    "trafficking": {
      category_en: "Child Trafficking & Child Labor",
      category_si: "ළමා ජාවාරම සහ ළමා ශ්‍රමය",
      laws: [
        {
          section: "360C",
          law_name: "Sri Lanka Penal Code",
          law_type: "primary",
          title: "Trafficking in Children",
          title_en: "Trafficking in Children",
          title_si: "ළමා ජාවාරම් සහ ළමා ශ්‍රමය",
          simple_explanation: "Recruiting, transporting, transferring, harboring, or receiving a child for exploitation (including forced labor or begging) is illegal and subject to mandatory long-term imprisonment.",
          simple_explanation_en: "Recruiting, transporting, transferring, harboring, or receiving a child for exploitation (including forced labor or begging) is illegal and subject to mandatory long-term imprisonment.",
          simple_explanation_si: "දරුවන් ශ්‍රමය සූරාකෑම, සිඟමන් යැවීම හෝ වෙනත් ජාවාරම් සඳහා බඳවා ගැනීම හෝ ප්‍රවාහනය කිරීම බරපතළ නීති විරෝධී ක්‍රියාවක් වන අතර අනිවාර්ය සිරදඬුවම් ලැබිය හැකිය.",
          reporting_guidance: "Do not confront traffickers. Gather details about locations, vehicles, and suspect identities, and report directly to Police CID or 1929.",
          reporting_guidance_en: "Do not confront traffickers. Gather details about locations, vehicles, and suspect identities, and report directly to Police CID or 1929.",
          reporting_guidance_si: "ජාවාරම්කරුවන් සමඟ සෘජුව ගැටීමට නොයන්න. ස්ථාන, වාහන සහ සැකකරුවන් පිළිබඳ තොරතුරු රැස් කර වහාම පොලිස් CID අංශයට හෝ 1929ට වාර්තා කරන්න."
        }
      ],
      roadmap: [
        "1. Safety First: Do not put yourself in danger; observe silently.",
        "2. Document Details: Record physical descriptions, locations, times and license plates.",
        "3. Police CID Call: Contact the Police Counter-Trafficking Unit or call 119.",
        "4. NCPA Intervention: Inform NCPA on 1929 for rescue coordination.",
        "5. Protection Program: Place the rescued child under the state victim protection program."
      ],
      roadmap_si: [
        "1. ප්‍රවේශම් වන්න: අනතුරට ලක් නොවී රහසිගතව තොරතුරු නිරීක්ෂණය කරන්න.",
        "2. විස්තර සටහන් කිරීම: සැකකටයුතු පුද්ගලයන්, ස්ථාන, වේලාවන් සහ වාහන අංක සටහන් කර ගන්න.",
        "3. පොලිස් CID සම්බන්ධ කර ගැනීම: CID අපරාධ විමර්ශන අංශයට හෝ 119 අමතන්න.",
        "4. NCPA මැදිහත්වීම: බේරාගැනීමේ මෙහෙයුම් සඳහා 1929 ළමා ආරක්ෂක අධිකාරිය දැනුවත් කරන්න.",
        "5. ආරක්ෂිත වැඩසටහන්: බේරාගත් දරුවා රජයේ වින්දිතයන් ආරක්ෂා කිරීමේ වැඩසටහනට යොමු කරන්න."
      ]
    },
    "general abuse": {
      category_en: "General Child Abuse & Rights Violation",
      category_si: "සාමාන්‍ය ළමා අපයෝජනය සහ අයිතිවාසිකම් උල්ලංඝනය",
      laws: [
        {
          section: "Chapter XVIII",
          law_name: "Sri Lanka Penal Code",
          law_type: "primary",
          title: "Offenses Affecting Child Safety",
          title_en: "Offenses Affecting Child Safety",
          title_si: "ළමා ආරක්ෂාවට අදාළ පොදු වැරදි",
          simple_explanation: "Any action that compromises the physical safety, mental health, education, or moral well-being of a minor is subject to investigation by child welfare and law enforcement authorities.",
          simple_explanation_en: "Any action that compromises the physical safety, mental health, education, or moral well-being of a minor is subject to investigation by child welfare and law enforcement authorities.",
          simple_explanation_si: "දරුවෙකුගේ ශාරීරික, මානසික, සෞඛ්‍ය හෝ අධ්‍යාපන යහපැවැත්මට හානි කරන ඕනෑම ක්‍රියාවක් නීතියට පටහැනි වන අතර ඒ පිළිබඳව පරීක්ෂණ පැවැත්විය හැකිය.",
          reporting_guidance: "Contact 1929 for assistance. You can file a complaint anonymously to protect your identity.",
          reporting_guidance_en: "Contact 1929 for assistance. You can file a complaint anonymously to protect your identity.",
          reporting_guidance_si: "උපදෙස් සහ මඟපෙන්වීම් සඳහා 1929 අමතන්න. ඔබගේ අනන්‍යතාවය රහසිගතව තබාගෙන පැමිණිල්ල ඉදිරිපත් කළ හැකිය."
        },
        {
          section: "39",
          law_name: "National Child Protection Authority Act, No. 50 of 1998",
          law_type: "supporting",
          title: "Definition of Child Abuse",
          title_en: "Definition of Child Abuse",
          title_si: "ළමා අපයෝජනය පිළිබඳ අර්ථ දැක්වීම",
          simple_explanation: "This section defines a child as anyone under 18 and defines child abuse broadly to cover criminal offences, exploitation, neglect, and child soldier recruitment.",
          simple_explanation_en: "This section defines a child as anyone under 18 and defines child abuse broadly to cover criminal offences, exploitation, neglect, and child soldier recruitment.",
          simple_explanation_si: "මෙම වගන්තිය මගින් වයස අවුරුදු 18 ට අඩු සෑම කෙනෙකුම ළමයෙකු ලෙස අර්ථ දක්වන අතර, ළමා අපයෝජනය යන්න අපරාධ වැරදි, සූරාකෑම, නොසලකා හැරීම සහ ළමා සොල්දාදුවන් බඳවා ගැනීම ඇතුළත් වන සේ පුළුල් ලෙස අර්ථ දක්වයි.",
          reporting_guidance: "Use this section to establish legal standing and age thresholds for child abuse victims under 18 years.",
          reporting_guidance_en: "Use this section to establish legal standing and age thresholds for child abuse victims under 18 years.",
          reporting_guidance_si: "වයස අවුරුදු 18 ට අඩු ළමා අපයෝජන වින්දිතයින් සඳහා නීතිමය තත්ත්වය සහ වයස් සීමාවන් තහවුරු කිරීමට මෙම වගන්තිය භාවිතා කරන්න."
        }
      ],
      roadmap: [
        "1. Assess Risk: Determine if the child is in immediate risk.",
        "2. Consult Experts: Call 1929 anonymously to discuss the situation.",
        "3. File Report: Submit a detailed report to NCPA if child safety is violated.",
        "4. Monitor Situation: Follow up with local child welfare officers.",
        "5. Community Care: Ensure the child has access to support networks."
      ],
      roadmap_si: [
        "1. අවදානම තක්සේරු කිරීම: දරුවා ක්ෂණික අවදානමක සිටීදැයි පරීක්ෂා කරන්න.",
        "2. උපදෙස් ලබා ගැනීම: නම සඳහන් නොකර 1929 අමතා නීතිමය පසුබිම සාකච්ඡා කරන්න.",
        "3. වාර්තා කිරීම: ළමා අයිතිවාසිකම් උල්ලංඝනය වී ඇත්නම් NCPA වෙත නිල පැමිණිල්ලක් කරන්න.",
        "4. නිරීක්ෂණය: ප්‍රාදේශීය ළමා සුබසාධන නිලධාරීන් කටයුතු කරන ආකාරය සොයා බලන්න.",
        "5. ප්‍රජා සහාය: දරුවාට අවශ්‍ය සුදුසු සමාජීය රැකවරණය තහවුරු කරන්න."
      ]
    }
  };

  const selectedDb = lawsDatabase[category];

  return {
    detected_language: language === "si" ? "Sinhala" : "English",
    abuse_category: category,
    abuse_category_en: selectedDb.category_en,
    abuse_category_si: selectedDb.category_si,
    relevant_laws: selectedDb.laws,
    decision_roadmap: language === "si" ? selectedDb.roadmap_si : selectedDb.roadmap,
    decision_roadmap_en: selectedDb.roadmap,
    decision_roadmap_si: selectedDb.roadmap_si,
    reporting_contacts: [
      {
        name: language === "si" ? "ජාතික ළමා ආරක්ෂක අධිකාරිය" : "National Child Protection Authority",
        contact: "1929",
        description: "24/7 child abuse helpline"
      },
      {
        name: language === "si" ? "ශ්‍රී ලංකා පොලිසිය" : "Sri Lanka Police",
        contact: "119",
        description: "Emergency police assistance"
      }
    ],
    privacy_note: "Your information is processed securely."
  };
}

/**
 * Query the Legal RAG system for legal guidance.
 * Falls back to local database if the API is offline (Failed to fetch).
 */
export async function queryLegalRAG(payload: LegalQuery): Promise<LegalResult> {
  console.log("[Legal RAG] Sending query:", {
    language: payload.language,
    descriptionLength: payload.description.length,
  });

  try {
    const response = await fetch(`${LEGAL_API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("[Legal RAG] Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = text;
      try {
        const errorJson = JSON.parse(text);
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // Not JSON
      }
      console.error("[Legal RAG] Error response:", errorMessage);
      throw new Error(errorMessage || "Failed to fetch legal guidance");
    }

    const data = await response.json();
    console.log("[Legal RAG] Success - received results for abuse category:", data.abuse_category);
    return data;
  } catch (error: any) {
    console.warn("[Legal RAG] API call failed. Falling back to offline mock database. Error:", error.message || error);
    
    // Graceful offline fallback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getMockLegalResult(payload.description, payload.language));
      }, 800); // Add a small delay to simulate network latency
    });
  }
}

/**
 * Health check for the Legal RAG API
 */
export async function checkLegalAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LEGAL_API_BASE_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    console.warn("[Legal RAG] API health check failed - API may be unavailable");
    return false;
  }
}
