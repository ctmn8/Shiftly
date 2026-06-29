// Per-employer application playbooks
// The single biggest thing that separates teens who get hired from those who don't

export interface Playbook {
  employer: string
  how: string[]       // step-by-step
  timing: string      // when to apply / follow up
  what_to_say: string // exact script
  avoid: string[]     // common mistakes
  dress: string
}

const PLAYBOOKS: Record<string, Playbook> = {
  'dutch bros': {
    employer: 'Dutch Bros Coffee',
    how: [
      'Walk in during a slow period — 2pm to 4pm on a weekday is ideal',
      'Ask to speak to the manager (not just any employee)',
      'Say: "Hi, I\'m interested in a barista position. Are you currently hiring?"',
      'If yes: hand them your resume and ask about next steps',
      'If they take your info: follow up in 4–5 days by walking back in',
    ],
    timing: 'Walk in, don\'t apply online. Dutch Bros values face-to-face energy.',
    what_to_say: '"Hi, I\'m [name]. I\'d love to work here — I\'m reliable, I love working with people, and I\'m available weekends. Are you accepting applications?"',
    avoid: [
      'Going during the morning rush (7–9am) or lunch (11am–1pm)',
      'Asking a barista instead of the manager',
      'Being too formal — Dutch Bros culture is warm and upbeat',
    ],
    dress: 'Clean, casual. No need for dress clothes. Look put-together, not corporate.',
  },

  'king soopers': {
    employer: 'King Soopers',
    how: [
      'Apply online at kingsoopers.com/careers — search "Colorado Springs"',
      'Select "Courtesy Clerk" or "Cashier" — these hire 16+ with no experience',
      'Check "open availability" even if you can\'t do every shift — you\'ll discuss in the interview',
      'Follow up in person 3 days after applying — go to Customer Service desk',
      'Ask to speak to the store manager or HR and say you applied online',
    ],
    timing: 'Apply online first, then follow up in person. Don\'t skip the in-person step — most teens don\'t do it.',
    what_to_say: '"Hi, my name is [name] and I applied online for the Courtesy Clerk position 3 days ago. I wanted to introduce myself and ask if you\'re still reviewing applications."',
    avoid: [
      'Going during store rush hours (5–7pm weekdays)',
      'Only applying online and waiting — you need to follow up',
      'Applying for deli or bakery roles — they require more experience',
    ],
    dress: 'Business casual. Clean jeans and a button-up or nice top. No hoodies.',
  },

  'target': {
    employer: 'Target',
    how: [
      'Apply at target.com/careers — search by zip code',
      'Apply for "General Merchandise Expert" or "Fulfillment Expert" — these hire 16+',
      'Complete the online assessment honestly — it\'s testing reliability and teamwork values',
      'If you get an interview invite, confirm it same day',
      'Show up 10 minutes early to the interview',
    ],
    timing: 'Target moves fast — if you get a callback, respond the same day.',
    what_to_say: 'In the interview: "I\'m really reliable — I\'ve never missed a commitment I made. I want to learn retail and I\'m excited to be part of a team."',
    avoid: [
      'Applying for more than 2 roles at once — it looks scattered',
      'Being late to your interview — there\'s zero tolerance',
      'Mentioning that you want a part-time role only (even if you do) until after you get the offer',
    ],
    dress: 'Business casual. They notice if you wear Target red — it shows you did your homework.',
  },

  "chick-fil-a": {
    employer: 'Chick-fil-A',
    how: [
      'Apply at chick-fil-a.com/careers — click "Restaurant Careers"',
      'Or walk in during 2–4pm and ask for the Operator or a manager',
      'Be ready for a same-day or next-day interview — Chick-fil-A moves fast',
      'They close Sundays — mention this is actually fine for you if it is',
    ],
    timing: 'Apply and expect a quick turnaround. Respond to any contact within hours.',
    what_to_say: '"I want to work somewhere I\'m proud of. I heard Chick-fil-A has great training and really cares about its team members."',
    avoid: [
      'Mentioning the Sunday closure negatively',
      'Being anything less than very friendly and enthusiastic — they hire on personality',
      'Wearing anything that looks sloppy',
    ],
    dress: 'Neat and polished. This is one of the more professional fast food chains.',
  },

  "mcdonald's": {
    employer: "McDonald's",
    how: [
      'Apply at mcdonalds.com/careers or walk into your nearest location',
      'Ask for the manager and say you\'d like to apply',
      'Many locations hire on the spot for crew member positions',
      'Be available for flexible shifts — mornings and weekends matter most',
    ],
    timing: 'McDonald\'s often has same-week hiring. If you walk in, you might start this week.',
    what_to_say: '"Hi, I\'m looking for my first job and I\'m a fast learner. I\'m available mornings and weekends and I want reliable hours."',
    avoid: [
      'Seeming picky about shift times in the first conversation',
      'Going during lunch rush (11am–1pm)',
    ],
    dress: 'Clean and casual. No need to dress up.',
  },

  'starbucks': {
    employer: 'Starbucks',
    how: [
      'Apply at starbucks.com/careers — select "Barista"',
      'Starbucks is selective — mention any customer service experience (even babysitting)',
      'Interview will ask behavioral questions: "Tell me about a time you..."',
      'Prepare 2–3 stories about being reliable, helping someone, or handling stress',
    ],
    timing: 'Starbucks takes 1–3 weeks. Be patient and follow up once after 1 week.',
    what_to_say: 'Behavioral story example: "When I was babysitting, one of the kids got hurt and I stayed calm, handled it, and called the parents right away. That\'s how I work under pressure."',
    avoid: [
      'Saying you love Starbucks drinks as a reason to work there',
      'Not preparing stories for behavioral questions',
    ],
    dress: 'Neat business casual.',
  },
}

export function getPlaybook(company: string): Playbook | null {
  const key = company.toLowerCase()
  for (const [pattern, playbook] of Object.entries(PLAYBOOKS)) {
    if (key.includes(pattern)) return playbook
  }
  return null
}

export const GENERIC_PLAYBOOK: Playbook = {
  employer: 'this employer',
  how: [
    'Visit their website and find the "Careers" or "Jobs" section',
    'Apply online with your resume',
    'Follow up in person 3–4 days after applying',
    'Ask for the manager when you walk in — not a regular employee',
    'Introduce yourself, mention you applied online, and ask about next steps',
  ],
  timing: 'The in-person follow-up is the most important step. Most teens skip it. Don\'t.',
  what_to_say: '"Hi, I\'m [name]. I applied online a few days ago and wanted to introduce myself. I\'m a hard worker, I\'m reliable, and I\'m really interested in working here."',
  avoid: [
    'Going during busy hours (lunch rush, morning rush)',
    'Only applying online and never following up',
    'Wearing something sloppy to the follow-up',
  ],
  dress: 'Clean and put-together. No need for a suit — just look like you made an effort.',
}
