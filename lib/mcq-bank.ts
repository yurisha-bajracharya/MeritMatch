import type { Category, McqQuestion, PublicMcq } from "./types";

/**
 * Situational-judgement multiple choice, three per category.
 *
 * Deliberately NOT trivia. Each question gives a realistic moment on the job
 * and asks for the best response, so it measures judgement, not memorised
 * facts. Several wrong options are tempting, which is what stops everyone
 * landing on the same score.
 *
 * The `correct` index is the answer key and must never be sent to a browser:
 * use `getPublicMcq()` for anything a candidate can see. Options are shuffled
 * client-side per candidate and the ORIGINAL index is what gets submitted, so
 * the key stays valid no matter how they were displayed.
 */

type Opt = [en: string, ne: string];

function q(
  id: string,
  prompt: [en: string, ne: string],
  options: [Opt, Opt, Opt, Opt],
  correct: number,
): McqQuestion {
  return {
    id,
    prompt: { en: prompt[0], ne: prompt[1] },
    options: options.map(([en, ne]) => ({ en, ne })),
    correct,
  };
}

export const MCQ_BANK: Record<Category, McqQuestion[]> = {
  retail: [
    q(
      "r_m1",
      ["A customer is angry that a new item stopped working. What is the best FIRST response?",
       "नयाँ सामान काम नगरेकोमा एक ग्राहक रिसाएका छन्। सबैभन्दा राम्रो पहिलो प्रतिक्रिया के हो?"],
      [
        ["Explain the shop's refund rules", "पसलको पैसा फिर्ता सम्बन्धी नियम बुझाउने"],
        ["Say it is not your department", "यो मेरो काम होइन भन्ने"],
        ["Apologise, listen to the whole problem, then offer a fix", "माफी माग्ने, पूरा समस्या सुन्ने, अनि समाधान दिने"],
        ["Ask them to come back tomorrow", "भोलि फेरि आउन भन्ने"],
      ],
      2,
    ),
    q(
      "r_m2",
      ["A shirt costs Rs 800 and is 15% off. What does the customer pay?",
       "एउटा सर्टको मूल्य रु. ८०० हो र १५% छुट छ। ग्राहकले कति तिर्छन्?"],
      [
        ["Rs 785", "रु. ७८५"],
        ["Rs 680", "रु. ६८०"],
        ["Rs 720", "रु. ७२०"],
        ["Rs 120", "रु. १२०"],
      ],
      1,
    ),
    q(
      "r_m3",
      ["At closing, the till has Rs 200 less cash than the sales record. What do you do first?",
       "दिनको अन्त्यमा दराजमा बिक्री रेकर्डभन्दा रु. २०० कम नगद छ। पहिले के गर्नुहुन्छ?"],
      [
        ["Recount the cash, check the receipts, then report the gap to your manager",
         "नगद फेरि गन्ने, रसिद जाँच्ने, अनि फरक मेनेजरलाई जानकारी दिने"],
        ["Quietly put in Rs 200 of your own money", "चुपचाप आफ्नै रु. २०० हालिदिने"],
        ["Change the sales record to match the cash", "नगदसँग मिल्ने गरी बिक्री रेकर्ड बदल्ने"],
        ["Say nothing because it is a small amount", "सानो रकम भएकाले केही नभन्ने"],
      ],
      0,
    ),
  ],

  admin: [
    q(
      "a_m1",
      ["You find two entries with the same name and phone number in the register. What is the best action?",
       "रजिस्टरमा एउटै नाम र फोन नम्बरका दुई प्रविष्टि भेट्टाउनुभयो। सबैभन्दा राम्रो कदम के हो?"],
      [
        ["Delete the newer one without telling anyone", "कसैलाई नभनी नयाँ वटा मेटाउने"],
        ["Keep both because fixing it is not your job", "ठीक गर्नु मेरो काम होइन भनी दुवै राख्ने"],
        ["Merge them by guessing which details are right", "कुन विवरण सही हो अनुमान गरी मिलाउने"],
        ["Mark the duplicate and confirm with the source before removing one",
         "दोहोरो चिन्ह लगाउने र एउटा हटाउनु अघि स्रोतसँग पुष्टि गर्ने"],
      ],
      3,
    ),
    q(
      "a_m2",
      ["Which file name will a coworker find easiest next month?",
       "कुन फाइल नाम अर्को महिना सहकर्मीले सबैभन्दा सजिलै भेट्टाउँछन्?"],
      [
        ["2026-11_Invoice_HimalMart_v2", "2026-11_Invoice_HimalMart_v2"],
        ["final FINAL new2", "final FINAL new2"],
        ["document1", "document1"],
        ["scan_0042", "scan_0042"],
      ],
      0,
    ),
    q(
      "a_m3",
      ["You will miss a deadline by one hour. What is the best action?",
       "तपाईं म्याद एक घण्टाले चुक्नुहुनेछ। सबैभन्दा राम्रो कदम के हो?"],
      [
        ["Work quietly and hope nobody notices", "चुपचाप काम गर्ने र कसैले नदेखोस् भन्ने आशा गर्ने"],
        ["Tell your manager early with a new time estimate", "मेनेजरलाई चाँडै नयाँ समय अनुमानसहित जानकारी दिने"],
        ["Skip the accuracy checks to save time", "समय बचाउन जाँच छोड्ने"],
        ["Wait until the deadline passes to say anything", "म्याद बितेपछि मात्र भन्ने"],
      ],
      1,
    ),
  ],

  office: [
    q(
      "o_m1",
      ["A supplier delivered 20 boxes instead of 30. Which message opening is best?",
       "आपूर्तिकर्ताले ३० बक्सको सट्टा २० बक्स पुर्यायो। कुन सन्देशको सुरुआत उत्तम हो?"],
      [
        ["You always get our orders wrong.", "तपाईंहरूले सधैं हाम्रो अर्डर गलत गर्नुहुन्छ।"],
        ["Thank you for the delivery. We received 20 of 30 boxes. Could you confirm when the other 10 will arrive?",
         "डेलिभरीका लागि धन्यवाद। हामीले ३० मध्ये २० बक्स पायौं। बाँकी १० कहिले आउँछ भनी पुष्टि गर्न सक्नुहुन्छ?"],
        ["Send the rest now.", "बाँकी अहिले पठाउनुस्।"],
        ["We will find another supplier.", "हामी अर्को आपूर्तिकर्ता खोज्छौं।"],
      ],
      1,
    ),
    q(
      "o_m2",
      ["You are organising a meeting for 8 people. What do you do FIRST?",
       "तपाईं ८ जनाको बैठक आयोजना गर्दै हुनुहुन्छ। पहिले के गर्नुहुन्छ?"],
      [
        ["Order snacks", "खाजा अर्डर गर्ने"],
        ["Print 50 copies of the agenda", "एजेन्डाका ५० प्रति छाप्ने"],
        ["Check everyone's availability and book a room for that time",
         "सबैको उपलब्धता जाँचेर त्यही समयका लागि कोठा बुक गर्ने"],
        ["Send the invitation an hour before", "एक घण्टा अघि निमन्त्रणा पठाउने"],
      ],
      2,
    ),
    q(
      "o_m3",
      ["You emailed a price list to the wrong person by mistake. What is the best action?",
       "तपाईंले गलतीले मूल्य सूची अर्कै व्यक्तिलाई इमेल गर्नुभयो। सबैभन्दा राम्रो कदम के हो?"],
      [
        ["Hope they ignore it", "उनीहरूले वास्ता नगरून् भन्ने आशा गर्ने"],
        ["Delete your sent copy and say nothing", "पठाएको प्रति मेटाएर केही नभन्ने"],
        ["Email the whole company to apologise", "सारा कम्पनीलाई माफी माग्दै इमेल गर्ने"],
        ["Tell your manager right away and politely ask the recipient to delete it",
         "तुरुन्तै मेनेजरलाई भन्ने र प्राप्तकर्तालाई शिष्टतापूर्वक मेटाउन अनुरोध गर्ने"],
      ],
      3,
    ),
  ],

  hospitality: [
    q(
      "h_m1",
      ["A guest says the soup is too salty. What is the best response?",
       "एक पाहुनाले सुप धेरै नुनिलो छ भन्छन्। सबैभन्दा राम्रो प्रतिक्रिया के हो?"],
      [
        ["Tell them it is the chef's recipe", "यो सेफको रेसिपी हो भन्ने"],
        ["Ask them to finish it first", "पहिले सकाउन भन्ने"],
        ["Apologise and offer to replace it right away", "माफी माग्ने र तुरुन्तै साट्न प्रस्ताव गर्ने"],
        ["Take it away without saying anything", "केही नभनी उठाएर लैजाने"],
      ],
      2,
    ),
    q(
      "h_m2",
      ["A group of 12 arrives but you only have tables for 8. What do you offer?",
       "१२ जनाको समूह आउँछ तर तपाईंसँग ८ जनाको मात्र टेबल छ। तपाईं के प्रस्ताव गर्नुहुन्छ?"],
      [
        ["Join two tables or offer a slightly later time, and confirm which they prefer",
         "दुई टेबल जोड्ने वा अलि पछिको समय दिने, र उनीहरूलाई के मन पर्छ पुष्टि गर्ने"],
        ["Say you are full", "ठाउँ छैन भन्ने"],
        ["Seat all 12 at the table for 8", "८ जनाको टेबलमा १२ जनालाई बसाउने"],
        ["Ask them to split across three restaurants", "तीन रेस्टुरेन्टमा बाँडिन भन्ने"],
      ],
      0,
    ),
    q(
      "h_m3",
      ["A guest says they have a peanut allergy. The dish is cooked in peanut oil. What do you do?",
       "एक पाहुनाले मूँगफलीको एलर्जी छ भन्छन्। परिकार मूँगफलीको तेलमा पकाइएको छ। तपाईं के गर्नुहुन्छ?"],
      [
        ["Say it is probably fine", "सायद ठीक छ भन्ने"],
        ["Tell the guest and the kitchen about the peanut oil and suggest a safe dish",
         "पाहुना र भान्साकोठालाई मूँगफलीको तेलबारे भन्ने र सुरक्षित परिकार सुझाउने"],
        ["Remove the visible peanuts and serve it", "देखिने मूँगफली हटाएर पस्कने"],
        ["Let the guest decide without mentioning the oil", "तेलको कुरा नभनी पाहुनालाई निर्णय गर्न दिने"],
      ],
      1,
    ),
  ],

  teaching: [
    q(
      "t_m1",
      ["A student still gets it wrong after you explain twice the same way. What next?",
       "उही तरिकाले दुईपटक बुझाउँदा पनि एक विद्यार्थीले गल्ती गर्छन्। अब के गर्ने?"],
      [
        ["Explain it a third time, louder", "तेस्रोपटक अझ चर्को स्वरमा बुझाउने"],
        ["Move on; they will catch up", "अगाडि बढ्ने, उनले आफै बुझ्लान्"],
        ["Try a different way, such as a drawing or real example, then ask them to explain it back",
         "फरक तरिका प्रयोग गर्ने, जस्तै चित्र वा वास्तविक उदाहरण, अनि उनैलाई बुझाउन लगाउने"],
        ["Tell them to ask a classmate", "साथीलाई सोध्न भन्ने"],
      ],
      2,
    ),
    q(
      "t_m2",
      ["Two students start fighting in class. What is the best first action?",
       "कक्षामा दुई विद्यार्थी झगडा गर्न थाल्छन्। सबैभन्दा राम्रो पहिलो कदम के हो?"],
      [
        ["Shout at both in front of everyone", "सबैको अगाडि दुवैलाई करायो गर्ने"],
        ["Ignore it until it stops", "रोकिएसम्म वास्ता नगर्ने"],
        ["Send both home immediately", "तुरुन्तै दुवैलाई घर पठाउने"],
        ["Calmly separate them, then speak to each privately after class",
         "शान्तसँग छुट्याउने, कक्षापछि प्रत्येकसँग एक्लै कुरा गर्ने"],
      ],
      3,
    ),
    q(
      "t_m3",
      ["How can you best check whether the class understood the lesson?",
       "कक्षाले पाठ बुझ्यो कि बुझेन भनी कसरी राम्ररी जाँच्न सकिन्छ?"],
      [
        ["Ask \"any questions?\" and wait", "\"केही प्रश्न?\" भनी सोधेर पर्खने"],
        ["Ask a few students to explain it in their own words or solve a quick example",
         "केही विद्यार्थीलाई आफ्नै शब्दमा बुझाउन वा छोटो उदाहरण हल गर्न लगाउने"],
        ["Notice who is sitting quietly", "को चुपचाप बसेको छ हेर्ने"],
        ["Assume yes if the lesson finished on time", "पाठ समयमै सकिएमा बुझे भनी मान्ने"],
      ],
      1,
    ),
  ],

  driving: [
    q(
      "d_m1",
      ["Before a long delivery, what should you do first?",
       "लामो डेलिभरी अघि पहिले के गर्नुपर्छ?"],
      [
        ["Start driving and check later", "चलाउन थालेर पछि जाँच्ने"],
        ["Walk around the vehicle: tyres, lights, brakes, and that the load is secure",
         "गाडी वरिपरि घुमेर हेर्ने: टायर, बत्ती, ब्रेक, र सामान राम्ररी बाँधिएको छ कि छैन"],
        ["Only check the fuel", "इन्धन मात्र जाँच्ने"],
        ["Ask the customer to check", "ग्राहकलाई जाँच्न भन्ने"],
      ],
      1,
    ),
    q(
      "d_m2",
      ["You are 20 km from your next stop with a loaded vehicle and the fuel is nearly empty. Best action?",
       "सामान लोड गरिएको गाडीमा अर्को गन्तव्य २० किमि टाढा छ र इन्धन लगभग सकिएको छ। सबैभन्दा राम्रो कदम?"],
      [
        ["Keep going and hope it lasts", "पुग्छ भन्ने आशामा चलाइरहने"],
        ["Switch the engine off at every traffic light", "हरेक ट्राफिक बत्तीमा इन्जिन बन्द गर्ने"],
        ["Refuel at the next safe station and tell dispatch you may be slightly late",
         "अर्को सुरक्षित पम्पमा इन्धन भर्ने र अलि ढिला हुन सक्छ भनी कार्यालयलाई जानकारी दिने"],
        ["Ask the customer to bring fuel", "ग्राहकलाई इन्धन ल्याउन भन्ने"],
      ],
      2,
    ),
    q(
      "d_m3",
      ["A road blockade will make you 40 minutes late. What do you do?",
       "सडक अवरोधले तपाईं ४० मिनेट ढिला हुनुहुनेछ। के गर्नुहुन्छ?"],
      [
        ["Say nothing and arrive late", "केही नभनी ढिलो पुग्ने"],
        ["Take a risky shortcut to make up the time", "समय पुर्याउन जोखिमपूर्ण छोटो बाटो लिने"],
        ["Switch your phone off", "फोन बन्द गर्ने"],
        ["Call the customer or office early with a new arrival time",
         "ग्राहक वा कार्यालयलाई चाँडै फोन गरी नयाँ पुग्ने समय बताउने"],
      ],
      3,
    ),
  ],

  construction: [
    q(
      "c_m1",
      ["You must lift a 50 kg cement bag. What is the safest way?",
       "तपाईंले ५० केजी सिमेन्टको बोरा उठाउनुपर्छ। सबैभन्दा सुरक्षित तरिका कुन हो?"],
      [
        ["Bend at the waist and pull it up quickly", "कम्मरबाट झुकेर छिट्टै तान्ने"],
        ["Bend your knees, keep your back straight, or use a second person or trolley",
         "घुँडा मोड्ने, ढाड सिधा राख्ने, वा अर्को व्यक्ति वा ट्रली प्रयोग गर्ने"],
        ["Lift it alone as fast as you can", "एक्लै सकेसम्म छिटो उठाउने"],
        ["Carry it far on one shoulder", "एक काँधमा राखेर टाढासम्म बोक्ने"],
      ],
      1,
    ),
    q(
      "c_m2",
      ["Rain has made the scaffolding slippery. What do you do?",
       "वर्षाले स्क्याफोल्डिङ चिप्लो बनाएको छ। तपाईं के गर्नुहुन्छ?"],
      [
        ["Work faster so you finish before it gets worse", "बिग्रनु अघि सक्न छिटो काम गर्ने"],
        ["Tell nobody and step carefully", "कसैलाई नभनी होसियारीसाथ हिँड्ने"],
        ["Stop working on it and tell the supervisor until it is safe",
         "त्यसमा काम रोक्ने र सुरक्षित नभएसम्म सुपरिवेक्षकलाई भन्ने"],
        ["Throw some sand on it and carry on", "माथि बालुवा छर्केर काम जारी राख्ने"],
      ],
      2,
    ),
    q(
      "c_m3",
      ["A 12-foot plank must be cut into 3 equal pieces. How long is each piece?",
       "१२ फिटको फल्याकलाई ३ बराबर टुक्रामा काट्नुपर्छ। प्रत्येक टुक्रा कति लामो हुन्छ?"],
      [
        ["3 feet", "३ फिट"],
        ["6 feet", "६ फिट"],
        ["5 feet", "५ फिट"],
        ["4 feet", "४ फिट"],
      ],
      3,
    ),
  ],

  "it-support": [
    q(
      "i_m1",
      ["A user forgot their password. What is the best action?",
       "एक प्रयोगकर्ताले पासवर्ड बिर्सिए। सबैभन्दा राम्रो कदम के हो?"],
      [
        ["Reset it for anyone who asks", "जसले सोध्यो उसैलाई रिसेट गरिदिने"],
        ["Confirm who they are first, then reset it using the official process",
         "पहिले को हुन् पुष्टि गर्ने, अनि आधिकारिक प्रक्रियाबाट रिसेट गर्ने"],
        ["Tell them to keep guessing", "अनुमान गरिरहन भन्ने"],
        ["Give them your own password", "आफ्नै पासवर्ड दिने"],
      ],
      1,
    ),
    q(
      "i_m2",
      ["A user sends their password in chat so you can fix their email. What is the best response?",
       "इमेल ठीक गर्न एक प्रयोगकर्ताले च्याटमा आफ्नो पासवर्ड पठाउँछन्। सबैभन्दा राम्रो प्रतिक्रिया के हो?"],
      [
        ["Use it and save it for later", "प्रयोग गरेर पछिका लागि सुरक्षित राख्ने"],
        ["Share it with the team", "टोलीसँग साझा गर्ने"],
        ["Do not use it. Fix the problem another way and ask them to change that password",
         "प्रयोग नगर्ने। अर्को तरिकाले समस्या समाधान गर्ने र उनलाई त्यो पासवर्ड बदल्न भन्ने"],
        ["Reply with your own password too", "आफ्नो पासवर्ड पनि पठाउने"],
      ],
      2,
    ),
    q(
      "i_m3",
      ["A computer suddenly became slow. What do you check first?",
       "एउटा कम्प्युटर अचानक ढिलो भयो। पहिले के जाँच्नुहुन्छ?"],
      [
        ["Reinstall Windows immediately", "तुरुन्तै विन्डोज फेरि हाल्ने"],
        ["Buy a new computer", "नयाँ कम्प्युटर किन्ने"],
        ["Close every program permanently", "सबै प्रोग्राम सधैंका लागि बन्द गर्ने"],
        ["See what is using the CPU, memory or disk, and whether it started after a recent change",
         "CPU, मेमोरी वा डिस्क के ले खाइरहेको छ, र हालैको परिवर्तनपछि सुरु भयो कि हेर्ने"],
      ],
      3,
    ),
  ],

  tailoring: [
    q(
      "s_m1",
      ["You are about to cut expensive fabric. Which habit is best?",
       "तपाईं महँगो कपडा काट्न लाग्दै हुनुहुन्छ। कुन बानी उत्तम हो?"],
      [
        ["Cut quickly to save time", "समय बचाउन छिटो काट्ने"],
        ["Guess from the last customer's size", "अघिल्लो ग्राहकको नापबाट अनुमान गर्ने"],
        ["Measure twice, mark with chalk, then cut once", "दुईपटक नाप्ने, चक लगाएर चिन्ह लगाउने, अनि एकपटक काट्ने"],
        ["Cut extra everywhere and hope it fits", "सबैतिर बढी काटेर मिल्छ भन्ने आशा गर्ने"],
      ],
      2,
    ),
    q(
      "s_m2",
      ["A regular customer's body measurements may have changed since last year. What do you do?",
       "नियमित ग्राहकको नाप गत वर्षदेखि बदलिएको हुन सक्छ। तपाईं के गर्नुहुन्छ?"],
      [
        ["Re-measure them before cutting", "काट्नु अघि फेरि नाप्ने"],
        ["Use last year's measurements", "गत वर्षकै नाप प्रयोग गर्ने"],
        ["Ask them to guess their size", "आफ्नो साइज अनुमान गर्न लगाउने"],
        ["Make it larger to be safe", "सुरक्षित होस् भनी ठूलो बनाउने"],
      ],
      0,
    ),
    q(
      "s_m3",
      ["A power cut means you cannot finish an order by the promised date. What do you do?",
       "बिजुली गएका कारण तपाईं वाचा गरेको मितिमा अर्डर सक्न सक्नुहुन्न। के गर्नुहुन्छ?"],
      [
        ["Say nothing and deliver late", "केही नभनी ढिला दिने"],
        ["Tell the customer early and agree a new date", "ग्राहकलाई चाँडै भन्ने र नयाँ मिति मिलाउने"],
        ["Hand over the unfinished garment", "अधुरो लुगा नै हस्तान्तरण गर्ने"],
        ["Blame the customer", "ग्राहकलाई दोष दिने"],
      ],
      1,
    ),
  ],
};

export const getMcq = (category: Category): McqQuestion[] =>
  MCQ_BANK[category] ?? [];

/** The candidate-facing view: prompt and options only. No answer key. */
export function getPublicMcq(category: Category): PublicMcq[] {
  return getMcq(category).map(({ id, prompt, options }) => ({
    id,
    prompt,
    options,
  }));
}
