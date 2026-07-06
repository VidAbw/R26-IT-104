// Sri Lankan Child Protection Legal Knowledge Base (English and Sinhala)
// Includes descriptions, simple explanations, keywords, and reporting directions.

export interface LawRecord {
  id: string;
  lawName: string;
  lawNameSi: string;
  section: string | null;
  category: string;
  keywords: string[];
  whyRelevant: string;
  whyRelevantSi: string;
  simpleExplanation: string;
  simpleExplanationSi: string;
  recommendedAction: string;
  recommendedActionSi: string;
}

export const LAWS_DATABASE: LawRecord[] = [
  {
    id: "ncpa_1998",
    lawName: "National Child Protection Authority Act, No. 50 of 1998",
    lawNameSi: "1998 අංක 50 දරන ජාතික ළමා ආරක්ෂක අධිකාරී පනත",
    section: "General",
    category: "general_protection",
    keywords: ["ncpa", "protection", "authority", "reporting", "investigation", "helpline", "1929", "ළමා ආරක්ෂක", "පනත", "බලධාරීන්"],
    whyRelevant: "NCPA is the primary authority coordinating the prevention of child abuse, protecting child victims, and monitoring investigations.",
    whyRelevantSi: "ජාතික ළමා ආරක්ෂක අධිකාරිය (NCPA) යනු ළමා අපයෝජන වැළැක්වීම, වින්දිත ළමුන් ආරක්ෂා කිරීම සහ විමර්ශන සම්බන්ධීකරණය කරන ප්‍රධාන ආයතනයයි.",
    simpleExplanation: "NCPA supports child abuse prevention, treatment and support, advice to government, investigation monitoring, and running the 1929 Child Helpline.",
    simpleExplanationSi: "ළමා අපයෝජන වැළැක්වීම, වින්දිත ළමයින් ආරක්ෂා කිරීම, ප්‍රතිකාර හා සහාය සැලසීම, සහ 1929 ළමා උපකාරක සේවය ක්‍රියාත්මක කිරීම මෙමගින් සිදු කරයි.",
    recommendedAction: "Report the incident directly to the NCPA via the 1929 Helpline.",
    recommendedActionSi: "1929 උපකාරක අංකය ඔස්සේ සිද්ධිය සෘජුවම ජාතික ළමා ආරක්ෂක අධිකාරිය වෙත වාර්තා කරන්න."
  },
  {
    id: "pc_308",
    lawName: "Penal Code Section 308",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 308 වගන්තිය",
    section: "308",
    category: "physical_abuse",
    keywords: ["abandon", "expose", "under twelve", "abandonment", "අත්හැරීම", "නිරාවරණය", "12ට අඩු"],
    whyRelevant: "Applies to abandonment, exposure, or neglecting a child under 12 years of age.",
    whyRelevantSi: "වයස අවුරුදු 12ට අඩු දරුවෙකු හිතාමතාම අත්හැර දැමීම හෝ රැකවරණයක් නොමැතිව දමා යාම මෙම වගන්තියට අදාළ වේ.",
    simpleExplanation: "It is a criminal offence for any parent or guardian to expose or wholly abandon a child under the age of twelve years.",
    simpleExplanationSi: "වයස අවුරුදු දොළහට අඩු දරුවෙකුගේ මව්පියන් හෝ භාරකරු විසින් දරුවාව සම්පූර්ණයෙන්ම අත්හැර දැමීම හෝ අනාරක්ෂිතව නිරාවරණය කිරීම දඬුවම් ලැබිය හැකි අපරාධයකි.",
    recommendedAction: "Contact the Police or NCPA immediately to rescue and secure the safety of the abandoned child.",
    recommendedActionSi: "අත්හැර දැමූ දරුවා බේරා ගැනීමට සහ ආරක්ෂාව තහවුරු කිරීමට වහාම පොලිසිය හෝ NCPA අමතන්න."
  },
  {
    id: "pc_308a",
    lawName: "Penal Code Section 308A",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 308A වගන්තිය",
    section: "308A",
    category: "physical_abuse",
    keywords: ["cruelty", "ill-treatment", "willful assault", "neglect", "suffer", "health injury", "hitting", "beating", "කෲරත්වය", "හිංසා කිරීම", "නොසලකා හැරීම", "පහර දීම", "තුවාල"],
    whyRelevant: "Covers cruelty, willful assault, ill-treatment, neglect, or abandonment of any child under 18 years.",
    whyRelevantSi: "වයස අවුරුදු 18ට අඩු ඕනෑම දරුවෙකුට පහරදීම, නොසලකා හැරීම, කෲර ලෙස සැලකීම හෝ අත්හැර දැමීම මෙම වගන්තියට අදාළ වේ.",
    simpleExplanation: "Whoever having charge of a child under 18 years willfully assaults, ill-treats, neglects or abandons the child, causing unnecessary suffering or injury to health, commits an offence.",
    simpleExplanationSi: "වයස අවුරුදු 18ට අඩු දරුවෙකු රැකබලා ගැනීමට බැඳී සිටින අයෙකු එම දරුවාට හිතාමතාම පහරදීම, හිංසා කිරීම, නොසලකා හැරීම හෝ අත්හැර දැමීම මඟින් ශාරීරික හෝ මානසික පීඩාවට පත්කිරීම බරපතළ වරදකි.",
    recommendedAction: "Report the cruelty and secure medical care for any injuries the child has sustained.",
    recommendedActionSi: "කෲරත්වය පිළිබඳව වාර්තා කර දරුවාට සිදුවී ඇති තුවාල සඳහා වහාම වෛද්‍ය ප්‍රතිකාර ලබා දෙන්න."
  },
  {
    id: "pc_345",
    lawName: "Penal Code Section 345",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 345 වගන්තිය",
    section: "345",
    category: "sexual_abuse",
    keywords: ["harassment", "sexual harassment", "words", "gestures", "advances", "sexual comments", "ලිංගික හිරිහැරය", "ලිංගික අදහස්", "කැමැත්තක් නැති"],
    whyRelevant: "Applies to sexual harassment, including physical force, words, or gestures causing sexual annoyance.",
    whyRelevantSi: "ශාරීරික බලහත්කාරකම්, වචන, හෝ හැඟීම් මඟින් සිදුවන ලිංගික හිරිහැර කිරීම් සඳහා මෙම වගන්තිය අදාළ වේ.",
    simpleExplanation: "Any person who sexually harasses another using assault, criminal force, words, or actions causing sexual annoyance commits an offence.",
    simpleExplanationSi: "පහරදීමකින්, සාපරාධී බලහත්කාරයකින්, වචනයකින් හෝ ක්‍රියාවකින් වෙනත් අයෙකුට ලිංගික හිරිහැරයක් හෝ ලිංගික කරදරයක් සිදුකිරීම දඬුවම් ලැබිය හැකි වරදකි.",
    recommendedAction: "Document any offensive messages, comments, or details of physical advances and report to the Women and Children Bureau.",
    recommendedActionSi: "ලිංගික අදහස්, පණිවිඩ හෝ කායික හැසිරීම් පිළිබඳ තොරතුරු සටහන් කරගෙන පොලිස් ළමා හා කාන්තා කාර්යාංශය වෙත වාර්තා කරන්න."
  },
  {
    id: "pc_352",
    lawName: "Penal Code Section 352",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 352 වගන්තිය",
    section: "352",
    category: "child_exploitation",
    keywords: ["kidnap", "guardianship", "entice", "abduct", "taking away", "පැහැර ගැනීම", "භාරකාරත්වයෙන්", "රැගෙන යාම"],
    whyRelevant: "Applies to kidnapping a child from lawful guardianship (boys under 14, girls under 16) without guardian consent.",
    whyRelevantSi: "නීත්‍යානුකූල භාරකරුවෙකුගේ කැමැත්තකින් තොරව වයස 14ට අඩු පිරිමි ළමයෙකු හෝ 16ට අඩු ගැහැණු ළමයෙකු රැගෙන යාම මෙම වගන්තියට අදාළ වේ.",
    simpleExplanation: "Taking or enticing any minor (under 14 for boys, under 16 for girls) out of the keeping of the lawful guardian without consent is kidnapping.",
    simpleExplanationSi: "භාරකරුගේ කැමැත්තෙන් තොරව බාලවයස්කාර දරුවෙකු (පිරිමි ළමයින් 14ට අඩු, ගැහැණු ළමයින් 16ට අඩු) භාරකාරත්වයෙන් ඉවතට රැගෙන යාම හෝ පොළඹවා ගැනීම පැහැර ගැනීමක් ලෙස සැලකේ.",
    recommendedAction: "Alert the police immediately. Give full details of the suspect, child, and location last seen.",
    recommendedActionSi: "වහාම පොලිසිය දැනුවත් කරන්න. සැකකරු, දරුවා සහ අවසන් වරට දුටු ස්ථානය පිළිබඳ සම්පූර්ණ විස්තර ලබා දෙන්න."
  },
  {
    id: "pc_360a",
    lawName: "Penal Code Section 360A",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 360A වගන්තිය",
    section: "360A",
    category: "sexual_abuse",
    keywords: ["procuration", "prostitute", "brothel", "detain", "ප්‍රසම්පාදනය", "ගණිකා සේවය", "රඳවා ගැනීම"],
    whyRelevant: "Applies when a person procures or detains a child for illicit sexual activity or exploitation.",
    whyRelevantSi: "නීති විරෝධී ලිංගික ක්‍රියා හෝ සූරාකෑම සඳහා දරුවෙකු බඳවා ගැනීම හෝ රඳවා තබා ගැනීම මෙහිදී අදාළ වේ.",
    simpleExplanation: "Procuring, attempting to procure, or detaining a person for sexual abuse or prostitution is strictly illegal.",
    simpleExplanationSi: "ලිංගික අපයෝජනය හෝ ගණිකා වෘත්තිය සඳහා පුද්ගලයෙකු බඳවා ගැනීම, පොළඹවා ගැනීම හෝ සිරකර තැබීම සපුරා තහනම් වේ.",
    recommendedAction: "Inform the police immediately to carry out a rescue operation and protect the victim.",
    recommendedActionSi: "දරුවා බේරා ගැනීමට සහ වින්දිතයා ආරක්ෂා කිරීමට වහාම පොලිසිය දැනුවත් කරන්න."
  },
  {
    id: "pc_360c",
    lawName: "Penal Code Section 360C",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 360C වගන්තිය",
    section: "360C",
    category: "child_exploitation",
    keywords: ["traffic", "trafficking", "forced labour", "begging", "commercial sex", "ජාවාරම", "මිනිස් ජාවාරම", "බලහත්කාර ශ්‍රමය", "හිඟාකෑම"],
    whyRelevant: "Relates to human trafficking of children for benefits, forced labor, or commercial sexual exploitation.",
    whyRelevantSi: "මුදල් හෝ වෙනත් වාසි සඳහා දරුවන් මිනිස් ජාවාරමට ලක් කිරීම, බලහත්කාරයෙන් වැඩෙහි යෙදවීම හෝ ලිංගික සූරාකෑමට ලක්කිරීම මෙයට අදාළ වේ.",
    simpleExplanation: "Buying, selling, transporting, harboring or receiving children for exploitation, including forced labor or commercial sex, is a major crime.",
    simpleExplanationSi: "බලහත්කාර ශ්‍රමය හෝ ලිංගික සූරාකෑම ඇතුළු සූරාකෑමේ අරමුණින් දරුවන් මිලදී ගැනීම, විකිණීම, ප්‍රවාහනය කිරීම හෝ රඳවා තබා ගැනීම දඬුවම් ලැබිය හැකි බරපතළ අපරාධයකි.",
    recommendedAction: "Contact the Police Counter-Trafficking Unit or Police Emergency (119) immediately without confronting suspects.",
    recommendedActionSi: "සැකකරුවන් සමඟ මුහුණට මුහුණ ගැටීමට නොගොස් වහාම පොලිස් මිනිස් ජාවාරම් මර්දන අංශය හෝ 119 අමතන්න."
  },
  {
    id: "pc_363",
    lawName: "Penal Code Section 363 (Rape)",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 363 වගන්තිය (ස්ත්‍රී දූෂණය)",
    section: "363",
    category: "sexual_abuse",
    keywords: ["rape", "sexual intercourse", "under 16", "consent", "දූෂණය", "ස්ත්‍රී දූෂණය", "ලිංගික සංසර්ගය", "16ට අඩු", "කැමැත්ත"],
    whyRelevant: "Defines rape. Crucially, sexual intercourse with a girl under 16 is treated as rape even if she consented.",
    whyRelevantSi: "ස්ත්‍රී දූෂණය අර්ථ දක්වයි. විශේෂයෙන්, වයස අවුරුදු 16ට අඩු ගැහැණු ළමයෙකු සමඟ කැමැත්ත ඇතිව හෝ නැතිව සිදුකරන ලිංගික සංසර්ගය ස්ත්‍රී දූෂණයක් ලෙස සැලකේ.",
    simpleExplanation: "Sexual intercourse with a female under the age of 16 constitutes statutory rape under Sri Lankan law, and consent is legally irrelevant.",
    simpleExplanationSi: "වයස අවුරුදු 16ට අඩු ගැහැණු ළමයෙකු සමඟ සිදුකරන ලිංගික සංසර්ගය දණ්ඩ නීති සංග්‍රහය යටතේ ස්ත්‍රී දූෂණයක් වන අතර, ඒ සඳහා කැමැත්ත තිබුණද එය නීත්‍යානුකූල නොවේ.",
    recommendedAction: "Take the child immediately to a government hospital for a medico-legal examination. Do not clean or wash the child to preserve evidence.",
    recommendedActionSi: "වෛද්‍ය පරීක්ෂණයක් සඳහා වහාම දරුවා රජයේ රෝහලකට රැගෙන යන්න. සාක්ෂි විනාශ වීම වැළැක්වීමට දරුවා සේදීම හෝ පිරිසිදු කිරීම නොකරන්න."
  },
  {
    id: "pc_364_365b",
    lawName: "Penal Code Section 365B (Grave Sexual Abuse)",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 365B වගන්තිය (බරපතළ ලිංගික අපයෝජනය)",
    section: "365B",
    category: "sexual_abuse",
    keywords: ["grave sexual abuse", "penetration", "object", "body part", "body touching", "බරපතළ ලිංගික අපයෝජනය", "අපයෝජනය", "ලිංගික අවයව ස්පර්ශය"],
    whyRelevant: "Applies to grave sexual abuse where a body part or object is inserted into the body, or other non-rape sexual assault is committed.",
    whyRelevantSi: "ස්ත්‍රී දූෂණ නොවන, ශරීරයට කිසියම් අවයවයක් හෝ උපකරණයක් ඇතුළු කරමින් හෝ බලහත්කාරයෙන් සිදුකරන බරපතළ ලිංගික අපයෝජනයන් සඳහා මෙම වගන්තිය අදාළ වේ.",
    simpleExplanation: "Any insertion of any object or body part for sexual gratification, or other severe sexual assault not amounting to rape, constitutes grave sexual abuse.",
    simpleExplanationSi: "ලිංගික තෘප්තිය සඳහා ශරීරයේ කිසියම් කොටසක් හෝ උපකරණයක් ශරීරයට ඇතුළු කිරීම හෝ ස්ත්‍රී දූෂණයට අදාළ නොවන වෙනත් බරපතළ ලිංගික ප්‍රහාරයන් සිදු කිරීම බරපතළ ලිංගික අපයෝජනයකි.",
    recommendedAction: "Seek immediate medico-legal support and do not wash clothes or the child to preserve physical evidence.",
    recommendedActionSi: "වහාම අධිකරණ වෛද්‍ය සහාය ලබා ගන්න. සාක්ෂි සුරැකීමට දරුවාගේ ඇඳුම් හෝ දරුවා සේදීමෙන් වළකින්න."
  },
  {
    id: "pc_364a",
    lawName: "Penal Code Section 364A (Incest)",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 364A වගන්තිය (ලේ ඥාති ලිංගික අපචාර)",
    section: "364A",
    category: "sexual_abuse",
    keywords: ["incest", "relative", "blood relation", "adoption", "father", "uncle", "brother", "stepfather", "ලේ ඥාති", "ඥාතියා", "පියා", "මාමා", "සහෝදරයා"],
    whyRelevant: "Covers incest: sexual relationship with close blood relations (parents, grandparents, siblings, aunts, uncles) or adoptive relations.",
    whyRelevantSi: "සමීප ලේ ඥාතීන් (මව්පියන්, සහෝදරයන්, මාමා, බාප්පා) හෝ දරුකමට ගත් පවුල් සබඳතා ඇති අය අතර සිදුවන ලිංගික අපචාර සඳහා මෙය අදාළ වේ.",
    simpleExplanation: "Sexual relationship or conduct between persons closely related by blood or adoption is incest, a highly severe criminal offence.",
    simpleExplanationSi: "ලේ ඥාති සබඳතා හෝ දරුකමට හදාගත් සබඳතා ඇති සමීපතමයන් අතර සිදුවන ලිංගික හැසිරීම් ලේ ඥාති ලිංගික අපචාර (Incest) ගණයට වැටෙන බරපතළ අපරාධයකි.",
    recommendedAction: "Ensure the child is kept in safe shelter away from the domestic relative, and report to the authorities immediately.",
    recommendedActionSi: "දරුවා අදාළ ඥාතියාගෙන් වෙන් කර ආරක්ෂිත ස්ථානයක රඳවන්න, වහාම බලධාරීන්ට වාර්තා කරන්න."
  },
  {
    id: "pc_365",
    lawName: "Penal Code Section 365",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 365 වගන්තිය",
    section: "365",
    category: "sexual_abuse",
    keywords: ["unnatural offence", "unnatural", "order of nature", "අස්වාභාවික", "අස්වාභාවික සංසර්ගය"],
    whyRelevant: "Applies to unnatural offences, which include carnal intercourse against the order of nature.",
    whyRelevantSi: "ස්වභාවධර්මයට පටහැනිව සිදුවන අස්වාභාවික ලිංගික වැරදි සඳහා මෙම වගන්තිය අදාළ වේ.",
    simpleExplanation: "Carnal intercourse against the order of nature with any man, woman, or animal is a punishable offence.",
    simpleExplanationSi: "මිනිසෙකු, ස්ත්‍රියක හෝ සතෙකු සමඟ ස්වභාවධර්මයට පටහැනිව සිදුකරන අස්වාභාවික ලිංගික හැසිරීම් දඬුවම් ලැබිය හැකි වරදකි.",
    recommendedAction: "Consult the child desk at police and seek medico-legal evaluation.",
    recommendedActionSi: "පොලිසියේ ළමා අංශය සම්බන්ධ කරගෙන වෛද්‍ය පරීක්ෂණයක් සඳහා යොමු වන්න."
  },
  {
    id: "pc_365a",
    lawName: "Penal Code Section 365A",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 365A වගන්තිය",
    section: "365A",
    category: "sexual_abuse",
    keywords: ["gross indecency", "indecent act", "බරපතළ අශෝභන ක්‍රියා", "අශෝභන ක්‍රියාව"],
    whyRelevant: "Covers gross indecency, including indecent acts with children.",
    whyRelevantSi: "ළමුන් සමඟ සිදු කෙරෙන බරපතළ අශෝභන ක්‍රියා සඳහා මෙම වගන්තිය අදාළ වේ.",
    simpleExplanation: "Committing or abetting gross indecent acts between persons is a criminal offence.",
    simpleExplanationSi: "පුද්ගලයන් අතර සිදුවන බරපතළ අශෝභන හෝ අශීලාචාර ක්‍රියාවන් සිදුකිරීම හෝ ඊට අනුබල දීම අපරාධ වරදකි.",
    recommendedAction: "Report the incident and secure psychological counselling for the child.",
    recommendedActionSi: "සිද්ධිය වාර්තා කර දරුවාට මනෝවිද්‍යාත්මක උපදේශන සහාය ලබා දෙන්න."
  },
  {
    id: "pc_286a",
    lawName: "Penal Code Section 286A",
    lawNameSi: "දණ්ඩ නීති සංග්‍රහයේ 286A වගන්තිය",
    section: "286A",
    category: "online_abuse",
    keywords: ["obscene", "exhibition", "photographs", "obscene material", "indecent video", "sharing images", "අසභ්‍ය ප්‍රකාශන", "ඡායාරූප", "අසභ්‍ය ද්‍රව්‍ය", "වීඩියෝ", "පින්තූර බෙදා හැරීම"],
    whyRelevant: "Covers obscene publications or exhibition involving children, or using children to create obscene material.",
    whyRelevantSi: "ළමුන් යොදාගනිමින් අසභ්‍ය ද්‍රව්‍ය සෑදීම, බෙදා හැරීම හෝ අන්තර්ජාලය ඔස්සේ ප්‍රදර්ශනය කිරීම මෙම වගන්තියට අදාළ වේ.",
    simpleExplanation: "Using, employing, or forcing children for obscene photographs, videos, or exhibitions, and distributing or possessing such material, is strictly prohibited.",
    simpleExplanationSi: "අසභ්‍ය ඡායාරූප, වීඩියෝ හෝ ප්‍රදර්ශන සඳහා ළමුන් යොදා ගැනීම, ඒවා ප්‍රකාශයට පත් කිරීම හෝ ළඟ තබා ගැනීම දැඩි සේ තහනම් වේ.",
    recommendedAction: "Save screenshots of the material and profiles, block the perpetrator, and report to Sri Lanka CERT and NCPA.",
    recommendedActionSi: "අසභ්‍ය ද්‍රව්‍ය හා ගිණුම්වල ස්ක්‍රීන්ෂොට් සුරක්ෂිත කරගෙන අදාළ පුද්ගලයා අවහිර කරන්න. ශ්‍රී ලංකා CERT සහ NCPA වෙත වාර්තා කරන්න."
  },
  {
    id: "pdva_2005",
    lawName: "Prevention of Domestic Violence Act, No. 34 of 2005",
    lawNameSi: "2005 අංක 34 දරන ගෘහස්ථ ප්‍රචණ්ඩත්වය වැළැක්වීමේ පනත",
    section: "General",
    category: "domestic_violence_context",
    keywords: ["domestic", "violence", "protection order", "home", "parent abuse", "relative abuse", "step-parent", "ගෘහස්ථ හිංසනය", "ආරක්ෂක නියෝගය", "ගෙදර", "පවුලේ සාමාජිකයා"],
    whyRelevant: "Applies when abuse occurs inside the home or domestic setting by parents, step-parents, guardians, or relative.",
    whyRelevantSi: "නිවස හෝ පවුල තුළ මව්පියන්, සුළු මව්පියන්, භාරකරුවන් හෝ ඥාතීන් විසින් සිදුකරන හිංසනයන් සඳහා මෙම පනත අදාළ වේ.",
    simpleExplanation: "Allows the court to issue Protection Orders to protect victims of violence within a domestic relationship, ensuring their safety and residence rights.",
    simpleExplanationSi: "පවුල් සබඳතා තුළ සිදුවන ප්‍රචණ්ඩත්වයෙන් වින්දිතයන් ආරක්ෂා කිරීමට සහ ඔවුන්ගේ ජීවත්වීමේ අයිතිය සුරක්ෂිත කිරීමට උසාවිය මඟින් ආරක්ෂණ නියෝග නිකුත් කිරීමට ඉඩ සලසයි.",
    recommendedAction: "Apply for a protection order through the magistrate's court with the assistance of a legal aid lawyer or police child desk.",
    recommendedActionSi: "පොලිසියේ ළමා අංශයේ හෝ නීති ආධාර නීතිඥයෙකුගේ සහාය ඇතිව මහේස්ත්‍රාත් අධිකරණයෙන් ආරක්ෂණ නියෝගයක් ලබා ගැනීමට අයදුම් කරන්න."
  },
  {
    id: "cypo_1939",
    lawName: "Children and Young Persons Ordinance, No. 48 of 1939",
    lawNameSi: "1939 අංක 48 දරන ළමුන් සහ යෞවනයන් පිළිබඳ ආඥාපනත",
    section: "General",
    category: "neglect",
    keywords: ["welfare", "custody", "probation", "institutionalized", "care home", "juvenile", "protection placement", "සුබසාධනය", "භාරකාරත්වය", "පරිවාස", "ළමා නිවාසය", "ආරක්ෂිත ස්ථානය"],
    whyRelevant: "Governs child care, custody, protection processes, and court welfare proceedings for children in need of care.",
    whyRelevantSi: "රැකවරණය අවශ්‍ය දරුවන්ගේ සුබසාධනය, භාරකාරත්වය, පරිවාස රැකවරණය සහ උසාවි මාර්ගයෙන් සුදුසු ආරක්ෂිත පරිසරයක රැඳවීම මෙයින් පාලනය වේ.",
    simpleExplanation: "Provides for the care, training, and welfare of children and young persons who are neglected, in danger, or in conflict with the law.",
    simpleExplanationSi: "නොසලකා හැරීමට ලක්වූ, අවදානමට ලක්වූ හෝ නීතියට පටහැනිව ක්‍රියා කළ ළමුන්ගේ සහ යෞවනයන්ගේ රැකවරණය, පුහුණුව සහ සුබසාධනය සඳහා විධිවිධාන සලසයි.",
    recommendedAction: "Contact the local Probation Officer or Child Rights Promotion Officer to arrange temporary shelter or safety placement.",
    recommendedActionSi: "දරුවාට තාවකාලික නවාතැන් හෝ ආරක්ෂිත රැකවරණයක් සලසා ගැනීමට ප්‍රාදේශීය පරිවාස නිලධාරී හෝ ළමා අයිතිවාසිකම් ප්‍රවර්ධන නිලධාරී අමතන්න."
  },
  {
    id: "espa_1999",
    lawName: "Evidence Special Provisions Act, No. 32 of 1999",
    lawNameSi: "1999 අංක 32 දරන සාක්ෂි (විශේෂ විධිවිධාන) පනත",
    section: "General",
    category: "general_protection",
    keywords: ["evidence", "video evidence", "testimony", "court", "child witness", "සහතික කිරීම්", "වීඩියෝ සාක්ෂි", "සාක්ෂි දීම", "උසාවිය", "ළමා සාක්ෂිකරු"],
    whyRelevant: "Enables child-sensitive court processes, including child video recorded testimony, to prevent trauma during trial.",
    whyRelevantSi: "උසාවි ක්‍රියාදාමයේදී දරුවා නැවත මානසික කම්පනයට පත්වීම වැළැක්වීම සඳහා වීඩියෝ මඟින් පටිගත කළ සාක්ෂි භාවිතා කිරීමට ඉඩ සලසයි.",
    simpleExplanation: "Allows children who are victims or witnesses in child abuse cases to give evidence via video link or video-recorded statements under special conditions.",
    simpleExplanationSi: "ළමා අපයෝජන නඩුවල වින්දිතයන් හෝ සාක්ෂිකරුවන් වන දරුවන්ට විශේෂ කොන්දේසි යටතේ වීඩියෝ මාර්ගයෙන් හෝ පටිගත කළ ප්‍රකාශ මඟින් සාක්ෂි දීමට අවස්ථාව ලබා දේ.",
    recommendedAction: "Request the police and prosecutor to arrange child-friendly video statement recording under this Act.",
    recommendedActionSi: "මෙම පනත යටතේ දරුවාට හිතකාමී වීඩියෝ සාක්ෂි පටිගත කිරීමක් සූදානම් කරන ලෙස පොලිසියෙන් සහ රජයේ නීතිඥවරයාගෙන් ඉල්ලා සිටින්න."
  },
  {
    id: "apvwa_2015",
    lawName: "Assistance to and Protection of Victims of Crime and Witnesses Act, No. 04 of 2015",
    lawNameSi: "2015 අංක 04 දරන අපරාධයක වින්දිතයන් සහ සාක්ෂිකරුවන් සහාය දීමේ සහ ආරක්ෂා කිරීමේ පනත",
    section: "General",
    category: "general_protection",
    keywords: ["victim safety", "witness protection", "threat", "intimidation", "protection", "වින්දිත ආරක්ෂාව", "සාක්ෂි ආරක්ෂාව", "තර්ජන", "බිය ගැන්වීම්"],
    whyRelevant: "Applies when the child victim or witnesses face threats, intimidation, or pressure from the offender.",
    whyRelevantSi: "අපරාධකරුගෙන් වින්දිත දරුවාට හෝ සාක්ෂිකරුවන්ට තර්ජන, බියගැන්වීම් හෝ පීඩනයන් එල්ල වන විට මෙය අදාළ වේ.",
    simpleExplanation: "Provides physical protection, rights, and support to victims of crimes and witnesses to ensure they are safe from intimidation during investigations and court trials.",
    simpleExplanationSi: "විමර්ශන සහ නඩු විභාග අතරතුර වින්දිතයන් සහ සාක්ෂිකරුවන් බිය ගැන්වීම්වලින් ආරක්ෂා කර ඔවුන්ගේ කායික ආරක්ෂාව සහ අයිතිවාසිකම් තහවුරු කරයි.",
    recommendedAction: "Report any threat or intimidation immediately to the Witness Protection Division or Police.",
    recommendedActionSi: "සිදුවන ඕනෑම තර්ජනයක් හෝ බියගැන්වීමක් වහාම සාක්ෂිකරුවන් ආරක්ෂා කිරීමේ කොට්ඨාසය වෙත හෝ පොලිසියට වාර්තා කරන්න."
  }
];

export const KEYWORDS = {
  categories: {
    physical_abuse: {
      en: ["hit", "hitting", "beat", "beating", "injuries", "wounds", "pain", "burns", "choking", "strangulation", "slap", "punishment", "visible harm", "bruise", "cut", "bleeding", "fracture"],
      si: ["පහර", "පහරදීම", "ගහනවා", "තැලීම", "තුවාල", "පිළිස්සුම්", "බෙල්ල මිරිකීම", "රෙදි පාර", "වේදනාව", "ලෝහ පාරවල්", "කැපීම්", "ලේ ගැලීම", "අතපය කැඩීම"]
    },
    sexual_abuse: {
      en: ["rape", "sexual", "harassment", "abuse", "incest", "unnatural", "indecency", "touch", "touching", "assault", "comment", "penetration", "force", "exploitation", "prostitution", "client", "kiss", "unwanted touching", "naked", "private parts"],
      si: ["ලිංගික", "අතවර", "දූෂණය", "ස්ත්‍රී දූෂණය", "ස්පර්ශ කිරීම", "අකමැත්තෙන්", "රහස් ප්‍රදේශ", "ඥාතියා ලිංගික", "මාමා ලිංගික", "පියා ලිංගික", "නිරුවත්", "අතවරය", "බලහත්කාරයෙන් ලිංගික"]
    },
    emotional_abuse: {
      en: ["threat", "threats", "fear", "shame", "guilt", "humiliation", "intimidate", "isolation", "sadness", "anger", "confusion", "shock", "numbness", "nightmares", "flashbacks", "anxiety", "withdrawal", "crying", "scared"],
      si: ["තර්ජන", "බිය", "බය", "ලැජ්ජාව", "වරදකාරිත්වය", "නින්දාව", "හුදකලා කිරීම", "දුක", "කෝපය", "අවුල", "කම්පනය", "සිහිනෙන් බියවීම", "කනස්සල්ල", "සමාජයෙන් ඈත්වීම", "අඬනවා"]
    },
    neglect: {
      en: ["starve", "food", "safety", "medical care", "abandon", "abandonment", "no supervision", "unsafe", "left alone", "child labour", "school absence", "shelter", "dirty", "unwashed"],
      si: ["නොසලකා", "නොසලකාහැරීම", "ආහාර නොමැති", "කෑම නැහැ", "රැකවරණයක් නැති", "අත්හැර", "තනිවම දමා", "ළමා ශ්‍රමය", "පාසල් නොයැවීම", "නවාතැන් නැති"]
    },
    online_abuse: {
      en: ["online", "internet", "facebook", "whatsapp", "messages", "grooming", "chat", "photos", "videos", "screenshots", "cyber", "harassment", "private images", "social media"],
      si: ["මාර්ගගත", "අන්තර්ජාලය", "ෆේස්බුක්", "වට්ස්ඇප්", "මැසේජ්", "චැට්", "පින්තූර", "වීඩියෝ", "ස්ක්‍රීන්ෂොට්", "සමාජ මාධ්‍ය", "අන්තර්ජාලය හරහා"]
    },
    domestic_violence_context: {
      en: ["domestic", "home", "inside home", "family", "parent", "father", "mother", "step-parent", "relative", "guardian", "uncle", "aunt", "household", "husband", "partner"],
      si: ["ගෘහස්ථ", "ගෙදර", "නිවසේදී", "පවුල", "මව්පියන්", "තාත්තා", "අම්මා", "සුළු පියා", "සුළු මව", "ඥාතීන්", "ඥාති", "මාමා", "බාප්පා", "භාරකරු"]
    },
    child_exploitation: {
      en: ["exploitation", "trafficking", "sell", "trafficked", "forced work", "armed conflict", "begging", "beg", "commercial sex", "money for child"],
      si: ["සූරාකෑම", "ජාවාරම", "මිනිස් ජාවාරම", "විකිණීම", "බලහත්කාරයෙන් වැඩෙහි", "සිඟමන්", "හිඟාකෑම", "මුදල් වෙනුවෙන්"]
    }
  },
  riskFactors: {
    absentParents: ["lives away", "absent", "ill", "abroad", "mother abroad", "father abroad", "dead", "separated", "අම්මා රට", "තාත්තා රට", "මව්පියන් නැති", "වෙන්වී"],
    offenderAccess: ["easy access", "close adult", "relative", "neighbor", "teacher", "guardian", "religious worker", "employer", "family friend", "relative inside", "ගුරුවරයා", "අසල්වැසියා", "භාරකරු", "ඥාතියා", "හාම්පුතා"],
    childSilent: ["afraid", "afraid of reaction", "shame", "silence", "threatened", "pressure", "keep silent", "බියෙන්", "ලැජ්ජාවෙන්", "නිහඬ", "තර්ජනය කර ඇති", "පීඩනය"]
  },
  signs: {
    physical: ["injury", "bruises", "burns", "wounds", "bleeding", "pain", "infection", "pregnancy", "sti", "hiv", "තුවාල", "තැලීම්", "පිළිස්සුම්", "ලේ", "වේදනාව", "ගැබ් ගැනීම", "ආසාදන"],
    behavioral: ["sleep problems", "insomnia", "sudden change", "avoiding", "washing clothes", "hiding clothes", "self-isolation", "withdrawal", "anger", "silence", "නින්ද නොයාම", "හදිසි වෙනස්වීම්", "මඟහැරීම", "ඇඳුම් සේදීම", "හුදකලා වීම", "නිහඬ වීම"],
    emotional: ["fear", "guilt", "shame", "sadness", "confusion", "shock", "anxiety", "nightmares", "flashbacks", "low self-esteem", "Concentration difficulty", "බය", "ලැජ්ජාව", "දුක", "කම්පනය", "සිහිනෙන් බියවීම", "අවධානය අඩු වීම"],
    social: ["conflict", "blaming", "victim blaming", "stigma", "community stigma", "isolation", "threats", "silence pressure", "පවුලේ ආරවුල්", "දොස් පැවරීම", "කොන් කිරීම", "පීඩනය", "තර්ජන"]
  }
};

export const COUNSELLING_SUPPORT = {
  en: {
    supportiveMessage: "Please remember: What happened is not the child's fault. You are not alone, and safe help is available to support the child's recovery.",
    options: [
      "1929 NCPA Psychosocial Division referral for child-friendly counselling.",
      "Supportive psychological first aid to ensure emotional stabilization.",
      "Trauma-informed counselling (such as child-friendly CBT) by certified clinical practitioners.",
      "Mindfulness-based exercises and child coping strategy sessions.",
      "Caregiver guidance and support to help the family establish a safe healing space."
    ]
  },
  si: {
    supportiveMessage: "කරුණාකර මතක තබා ගන්න: සිදුවූ දෙයෙහි වරද දරුවාගේ නොවේ. ඔබ තනි වී නැත, දරුවාගේ සුවය ලැබීමට සහාය වීම සඳහා ආරක්ෂිත උපකාර ලබාගත හැකිය.",
    options: [
      "දරුවාට හිතකාමී උපදේශනය සඳහා 1929 ජාතික ළමා ආරක්ෂක අධිකාරියේ මනෝ-සමාජීය අංශය වෙත යොමු කිරීම.",
      "දරුවාගේ චිත්තවේගීය ස්ථාවරත්වය තහවුරු කිරීම සඳහා මනෝවිද්‍යාත්මක ප්‍රථමාධාර ලබා දීම.",
      "ලියාපදිංචි වෛද්‍ය විශේෂඥයින් හරහා කම්පන-සංවේදී උපදේශනය (CBT වැනි) ලබා දීම.",
      "දරුවාට හිතකාමී මනස සන්සුන් කිරීමේ අභ්‍යාස සහ ගැටලුවලට මුහුණ දීමේ ක්‍රමවේද කියා දීම.",
      "පවුල තුළ දරුවාට ආරක්ෂිත සුවදායී පරිසරයක් නිර්මාණය කිරීම සඳහා රැකබලා ගන්නන් දැනුවත් කිරීම."
    ]
  }
};
