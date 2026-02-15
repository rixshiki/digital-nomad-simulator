# digital-nomad-simulator
 [Game] The vibe code Digital Nomad Simulator game

Game "Digital Nomad Simulator"
Concept: A life-management sim where players must create a sustainable "Game Loop" by balancing income, physical health, and self-improvement.

--------------------
Core Stats
--------------------
Players must manage four primary attributes:
Money (฿): Starts at 1,000 ฿ (Goal: Reach 1,000,000 ฿ to win).
Energy (0-100): Decreases when working or traveling; restored by sleeping.
Stress (0-100): Increases with heavy workloads or negative client feedback. Reaching 100 triggers "Burnout," making the player unable to work for 3 days.
Reputation (Starts at 0): Increases upon successful job completion, scaling with difficulty and quality of work.
Skill Level: Higher levels unlock higher-paying contracts.

--------------------
Locations & Activities
--------------------
Players navigate different locations that impact their stats differently:
The "Rat Hole" Rental: Free rest (slow Energy recovery). However, failing to pay the weekly rent results in Game Over (moving back into your mom's basement).
Co-working Cafe: Costs money for coffee, but increases the chance of finding high-quality jobs and reduces Stress more effectively than staying home.
Online Courses: Spend money and Energy to increase your Skill Level.

--------------------
Job Board (Contract System)
--------------------
Jobs are categorized into three tiers. The system pulls 3–5 random tasks daily from a pool of 90 fixed entries (30 per tier). Some jobs may remain on the board for several days.
Bug Fixing (Easy): Low pay, low Stress, low Energy cost (Ideal for the early game).
Web Development (Medium): Moderate pay; requires Skill Level 3+.
The "Hell" Deadline (Hard): Extremely high pay, but Stress skyrockets. If the job fails (calculated via RNG + Skill Level), you lose Reputation and receive no payment.
Random Events System
This system keeps the gameplay unpredictable and engaging by introducing elements of chance. The game utilizes a fixed library of 20 Positive Events and 20 Negative Events for the RNG (Random Number Generator) to pull from:
Positive Events (Buffs): like "Client is thrilled with your work! You received a 500 ฿ tip."
"The neighbor's Wi-Fi is down and unsecured—enjoy free internet for the day!" etc.
Negative Events (Debuffs): like "Your laptop crashed! Pay 1,000 ฿ for urgent repairs."
"Severe back pain from sitting too long! Pay medical fees and suffer a massive Energy drop." etc.

--------------------
Progression & Gear Upgrades
--------------------
As players earn more, they can invest in better equipment:
Level Equipment: Perks/Effects
1 Ancient Laptop: Slow work speed, Stress builds up quickly.
2 Mechanical Keyboard: Faster typing (Reduced Energy consumption).
3 Ergonomic Chair: Reduces the frequency of "Back Pain" random events.
4 MacBook Pro: Unlocks High-end contracts with 2x Income.

####################
Endings
####################
Bad Ending: "Back to Mom's House" – No money to paid the rent for 2 times and the landlord kicks you out.
Sad Ending: "Permanent Burnout" – Hitting 100 Stress for 3 times. You quit programming to sell meatballs on the street.
Good Ending: "The Ultimate Nomad" – Accumulate 1,000,000 ฿ in savings. You "retire" to a life of coding leisurely on a tropical beach.