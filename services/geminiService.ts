
/**
 * Local Content Service
 * This service provides fixed sets of appropriate content to be randomly shown on screen,
 * ensuring the game remains fully functional and error-free regardless of API status.
 */

const SUCCESS_FEEDBACK = [
  "Great job, thanks for the quick turnaround! 🚀",
  "Looks perfect. No notes. The team is impressed.",
  "You're a lifesaver. This works exactly as requested.",
  "Incredible speed! I'll definitely hire you again for the next sprint.",
  "Simple, clean, and efficient. I like your style.",
  "Passed all our internal tests. Payment sent immediately!",
  "Finally, a developer who actually reads the documentation.",
  "Solid work. Let's discuss a long-term contract soon.",
  "The UI looks crisp. Marketing is going to love this.",
  "Bug fixed and performance improved. You're a wizard.",
  "Clean code, passing tests, happy client. The triple threat!",
  "I wasn't expecting this until tomorrow. Thanks for the hustle!",
  "This is exactly what we needed to close the seed round.",
  "Our CTO says your PR was the cleanest one this month.",
  "The refactor actually reduced our cloud bill. Hero status!",
  "Great communication throughout. A pleasure to work with.",
  "You made sense of our spaghetti code. That deserves a bonus!",
  "The new feature is live and users are already loving it.",
  "Reliable as always. You're our go-to nomad.",
  "Everything is working perfectly. Cheers!"
];

const FAILURE_FEEDBACK = [
  "This is unacceptable. I won't pay for broken code.",
  "This isn't what we discussed at all. Total waste of time.",
  "I'm seeing 50 errors in the console. Do you even test locally?",
  "My grandma could code this better. Contract terminated.",
  "You missed the deadline and the code is spaghetti. No thanks.",
  "Terrible. I'm leaving a 1-star review on your profile.",
  "The site is down and it's your fault. I'm losing money here!",
  "I'm disputing this through the platform. Good luck.",
  "The 'fix' you pushed just broke three other features.",
  "Are you even a developer? This is basic stuff.",
  "I can't even get the dev environment to start. Total mess.",
  "Ghosted for two days and then you push this? We're done.",
  "The security audit failed miserably. We're hiring a professional.",
  "Your 'optimal' solution crashed our production server.",
  "It works on your machine? Too bad I'm not buying your machine.",
  "The README is in Greek and the code is in Latin. What is this?",
  "I asked for a dashboard, you gave me a blank page. Disappointing.",
  "Too many bugs to list. Don't bother fixing them, we've moved on.",
  "The logic is flawed and the design is ugly. Zero stars.",
  "We're going to have to rewrite all of this. Goodbye."
];

const HOROSCOPES = [
  "Code hard, sleep light. Mercury is in retrograde for your backend.",
  "A bug found today is a feature tomorrow. Stay optimistic.",
  "Your coffee-to-code ratio is looking sub-optimal. Refuel now.",
  "A generous client is in your future, but so is a merge conflict.",
  "Your CSS will align perfectly today, for at least five minutes.",
  "Avoid deleting 'node_modules' today; the spirits are restless.",
  "A legacy system will call to you. Do not answer its dark whispers.",
  "Fortune favors the bold refactor. Backup your data first.",
  "Your keyboard's 'S' key is feeling neglected. Write some 'Save' logic.",
  "An unexpected semicolon will change your life. Or at least your build.",
  "The cloud is heavy today. Expect high latency in your personal life.",
  "A junior developer will ask for help. Patience is your greatest skill.",
  "Documentation is your friend, even if it's currently a stranger.",
  "The git gods demand a commit. Do not use 'fixed stuff' as the message.",
  "Your ergonomic setup is your temple. Bow to the lumbar support.",
  "A pixel-perfect design is coming your way. Hope you like padding.",
  "The Wi-Fi will be strong where the coffee is expensive. Plan accordingly.",
  "A new framework has been released. Try not to jump ship just yet.",
  "Your 'Todo' list is growing sentient. Tackle the easiest task first.",
  "A silent phone is a happy nomad. Unless you're waiting for a wire transfer.",
  "Beware of the 'one more thing' client. They lurk in the shadows.",
  "Your terminal theme is beautiful. Others may not see it, but you do.",
  "Today is a good day to leave the cafe and see the actual sun.",
  "The stack overflow answer you seek is on page 2. Truly a rare day.",
  "Your logic is sound, but your variable names are questionable."
];

/**
 * Returns a random feedback string based on success/failure.
 * Now strictly uses the local 'fixed set' to avoid API errors.
 */
export const getClientFeedback = async (jobTitle: string, success: boolean): Promise<string> => {
  const library = success ? SUCCESS_FEEDBACK : FAILURE_FEEDBACK;
  return library[Math.floor(Math.random() * library.length)];
};

/**
 * Returns a random daily horoscope.
 * Now strictly uses the local 'fixed set' to avoid API errors.
 */
export const getDailyHoroscope = async (day: number): Promise<string> => {
  return HOROSCOPES[Math.floor(Math.random() * HOROSCOPES.length)];
};
