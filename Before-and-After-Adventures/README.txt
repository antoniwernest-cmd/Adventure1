BEFORE & AFTER ADVENTURES

Open index.html to begin. This folder contains the complete deployable activity.
There is no build step, package installation, account or server-side service.
Keep all the files and the assets folder together. No ZIP is required.

DEPLOYMENT
Upload the contents of this folder to your static website host. index.html must
be at the published root. For Netlify with a connected GitHub repository, place
these files at the repository root, or set the base directory to this folder.
The included netlify.toml publishes the current directory (.). No build command.
All pictures, scripts and styles are local; there are no external asset links.

ACTIVITY
50 unique new 3D animated story illustrations. Every picture shows a middle
moment. Students choose what happened immediately before and the most likely
next step. All wrong choices concern the same event, at a different time.

Level A: 50 stories, three choices for each Before and After step.
Level AA: the same 50 pictures, with four closer choices and finer timing.
100 stories across both levels, with 200 individual Before/After decisions.
A story earns credit once both steps have been answered correctly. Students
can view the steps in either order. Each picture opens on Before, including
saved pictures and reviews. Next first goes to After for the same
picture. Both answers must be correct before the next picture unlocks. The story
picker only allows unlocked pictures. Students can review and switch levels.

PICTURES AND READABILITY
Large text, large story picture, Enlarge picture and a View all 50 pictures
button on the landing pad. On narrow portrait screens, Picture and Choose
answers switch the view within one screen. Landscape keeps both alongside.
The illustrated children and families have a range of skin tones, backgrounds,
hair styles and clothing. ARTWORK.json contains the built-in image generation
prompt set, revision prompts, file paths and hashes for all 50 final pictures.

PROGRESS AND TEACHER TOOLS
Choose one of 20 school-supply pictures and reuse it to continue. Each profile
and level has separate progress. Saving is local to this browser and origin;
local files and a deployed site do not share progress. Switching browser/device
also starts a separate record. Download Excel reports to keep assessment records.

Teacher voice code: 259. Enable or disable voice for both levels in this browser.
Listen reads the middle moment, question and answer choices. Voice uses the
browser's installed speech voices. Voice speed is adjustable.

Teacher tools: Excel for one/all school-supply profiles, support level,
formative/summative assessment and profile reset. Reports contain Summary,
Progress, Attempts and Guide sheets. Incorrect choices, retries, hints, listens
and active time are recorded. Try this story again resets current answers for
both steps but keeps earned credit and assessment history. Reset this school
supply's progress clears its record after confirmation.

SCRIPT REUSE
Adapted from the previous Language Adventures project: core.js grading/profile
model, app.js saving/speech/assessment code, activity.html accessible shell,
styles.css controls/dialogs, teacher-voice.js/.css, objects.js, excel.js and
pictures.html/.css/.js. Existing school-supply SVGs, cat and balloon reused.
No image-generation API runner or extra runtime dependency is needed to deploy.

CHECKS
CHECKS.json records content, grading, asset and browser verification. The layout
was checked at common laptop, tablet and phone sizes, including 844 x 390.
The teacher voice code is a classroom convenience, not an authentication system.
