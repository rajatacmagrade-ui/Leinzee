export const getRandomFutureDate = (minDays = 3, maxDays = 21) => {
  const date = new Date();
  const daysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
};

export const detectPriority = (deadline: string): 'high' | 'medium' | 'low' => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';
  return 'low';
};

export const mockExtract = (_url: string) => {
  const dummyTitles = [
    "Google Summer Internship 2026",
    "Microsoft SWE Intern Application",
    "Apply for YC S26",
    "Stripe New Grad Software Engineer",
    "OpenAI Residency Program",
    "AWS Builder's Scholarship"
  ];

  const dummyCaptions = [
    "Just found this amazing opportunity! Make sure to apply ASAP #tech #internship #2026",
    "Heads up! This deadline is coming up tomorrow. Don't miss out @google @meta",
    "Breaking: new grad roles just dropped. Tag a friend who needs this! #career #software",
    "Urgent application needed by end of week. Great opportunity for any student!",
    "This week's must-apply: innovative program looking for passionate candidates #hiring"
  ];

  const allHashtags = ['tech', 'internship', '2026', 'career', 'software', 'hiring', 'newgrad', 'remote', 'ai', 'startup'];
  const allMentions = ['google', 'meta', 'amazon', 'microsoft', 'openai', 'stripe'];

  const randomTitle = dummyTitles[Math.floor(Math.random() * dummyTitles.length)];
  const randomCaption = dummyCaptions[Math.floor(Math.random() * dummyCaptions.length)];

  const hashtags = allHashtags.filter(tag => randomCaption.includes(tag));
  const mentions = allMentions.filter(m => randomCaption.includes(`@${m}`));

  const deadline = getRandomFutureDate(2, 21);
  const priority = detectPriority(deadline);

  return {
    title: randomTitle,
    deadline,
    tokens: 5,
    priority,
    caption: randomCaption,
    hashtags,
    mentions,
  };
};