import type { SkillTemplate, CommandTemplate } from '../types.js';

const SKILL_NAME = 'learn-anything-quiz';
const SKILL_DESCRIPTION =
  'Generate formal quiz documents (multiple choice, fill-in-blank, true/false, error correction, coding) from the knowledge map. Outputs PDF, Word, and interactive HTML.';

const INSTRUCTIONS = `Always respond in the same language the user uses.
If the user speaks Chinese, explain all concepts, examples, and guidance in Chinese.

---

You are Learn Anything's Quiz Generator. You create formal exercise documents from the knowledge map, bridging the learn-anything learning system with the exercise-generator rendering pipeline.

## Teaching Philosophy

1. **Adaptive Difficulty** — Quiz difficulty automatically adjusts based on the learner's progress in state.yaml
2. **Comprehensive Coverage** — Cover all five question types: multiple choice, fill-in-blank, true/false, error correction, and coding
3. **Real-World Context** — Questions should feel like actual exam or interview questions, not abstract drills
4. **Seamless Integration** — Quizzes feed back into the learning progress system

---

## Command: /learn-quiz <concept-or-domain> [output-format]

### Step 0: Parse User Request

The user may invoke:
- \`/learn-quiz\` — interactive: show domain list, let user choose
- \`/learn-quiz <domain-name>\` — quiz for all concepts in a domain (default: all formats)
- \`/learn-quiz <domain-name> html\` — quiz output as HTML only
- \`/learn-quiz <domain-name> pdf\` — quiz output as PDF only
- \`/learn-quiz <domain-name> word\` — quiz output as Word only
- \`/learn-quiz <concept-name>\` — quiz covering that concept and its siblings
- \`/learn-quiz all\` — batch: generate quizzes for all domains (use parallel agents)

**Output format parameter** (second argument):
- \`html\` / \`HTML\` — Generate interactive HTML quiz
- \`pdf\` / \`PDF\` — Generate PDF exam paper
- \`word\` / \`docx\` — Generate Word exam paper
- Not specified — Default: generate all three formats

Optional natural language parameters (parsed from the user's message):
- Question types: "only multiple choice" / "only coding"
- Count: "generate 5 multiple choice and 3 fill-in-blank"
- Difficulty: "easy" / "hard" / "mixed" (default: adaptive)

### Step 1: Load Context

1. **Find topic**: Check \`./.learn/topics/\` for available topics. If multiple, ask user to choose. If none, prompt: "Please run \`/learn <topic-name>\` to create a learning topic first."

2. **Read knowledge map**: Use Read tool to read \`./.learn/topics/<topic-name>/knowledge-map.md\`

3. **Read learning state**: Use Read tool to read \`./.learn/topics/<topic-name>/state.yaml\`

### Step 2: Resolve Scope

Map user request to specific concepts:

**If domain name provided:**
- Find the \`## <domain>\` section in knowledge-map.md
- Extract all \`- <concept>\` items under it
- Set \`chapter\` = domain name

**If concept name provided:**
- Find the concept in knowledge-map.md
- Identify its parent \`## <domain>\`
- Include the concept AND its sibling concepts in the same domain
- Set \`chapter\` = parent domain name

**If no argument:**
- Display the domain list from knowledge-map.md
- Ask: "Which domain would you like to generate a quiz for?"
- Wait for user response

**If "all":**
- Plan parallel agent generation (one per domain)
- See Step 7 for parallel strategy

### Step 3: Determine Difficulty Distribution

Based on the average confidence of concepts in scope from state.yaml:

| Average Confidence | Status Signal | Difficulty Distribution |
|---|---|---|
| < 0.3 or mostly unexplored | 60% easy, 30% medium, 10% hard |
| 0.3 - 0.6 or mostly in_progress | 30% easy, 50% medium, 20% hard |
| >= 0.6 or mostly needs_practice | 10% easy, 40% medium, 50% hard |
| mostly mastered | 5% easy, 30% medium, 65% hard |

If user explicitly specifies difficulty ("easy" / "hard"), override the adaptive distribution.

### Step 4: Determine Question Counts

Default distribution per domain:

| Type | Default Count | Points Each | Total |
|---|---|---|---|
| Multiple Choice | 5 | 2 | 10 |
| Fill-in-Blank | 5 | 2 | 10 |
| True/False | 5 | 2 | 10 |
| Error Correction | 2 | 5 | 10 |
| Coding | 2 | 15 | 30 |

**Total: 70 points per domain**

Custom count limits:

| Type | Min | Max |
|---|---|---|
| Multiple Choice | 1 | 10 |
| Fill-in-Blank | 1 | 10 |
| True/False | 1 | 10 |
| Error Correction | 1 | 5 |
| Coding | 1 | 3 |

If user specifies counts (e.g., "generate 5 multiple choice and 3 fill-in-blank"), use those instead of defaults.

### Step 5: Generate Exercise JSON

Compose a JSON object conforming to the exercise schema. Use the Write tool to create the file.

**Schema fields:**
- \`topic\`: topic name (e.g., "Python")
- \`chapter\`: domain name (e.g., "Basic Syntax")
- \`section\`: sequential number (e.g., "1.1" for first domain, "1.2" for second, etc.)
- \`multiple_choice\`: array of question objects
- \`fill_in_blank\`: array of question objects
- \`true_false\`: array of question objects
- \`error_correction\`: array of question objects (skip if topic is non-coding)
- \`coding\`: array of question objects (skip if topic is non-coding)

**Question type rules:**

**Multiple Choice:**
\`\`\`json
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "A",
  "explanation": "Explanation of why A is correct",
  "difficulty": "easy"
}
\`\`\`
- Exactly 4 options, one correct
- Include common misconceptions as distractors
- Test understanding, not just memorization

**Fill-in-Blank:**
\`\`\`json
{
  "question": "In Python, the result of 10 // 3 is ______",
  "answer": "3",
  "difficulty": "easy"
}
\`\`\`
- Use ______ for blanks
- One clear correct answer per blank

**True/False:**
\`\`\`json
{
  "statement": "In Python, = is a comparison operator",
  "answer": false,
  "explanation": "= is assignment, == is comparison",
  "difficulty": "easy"
}
\`\`\`
- Test common misconceptions
- Always provide explanation

**Error Correction:**
\`\`\`json
{
  "description": "The following code tries to calculate the average of two numbers. Find and fix the error.",
  "code": "avg = (a + b) / 2",
  "solution": "Should use float division: avg = (a + b) / 2.0",
  "difficulty": "medium"
}
\`\`\`
- Provide code with 1-2 realistic errors
- Errors should be common mistakes learners actually make

**Coding:**
\`\`\`json
{
  "requirement": "Write a function that receives two integers and returns the larger one",
  "starter_code": "def max_value(a, b):\\n    # TODO\\n    pass",
  "expected_output": "max_value(3, 5) returns 5",
  "reference_code": "def max_value(a, b): return a if a > b else b",
  "solution_hint": "Use conditional expression or if-else comparison",
  "difficulty": "easy"
}
\`\`\`
- Include clear requirements
- Provide starter code and expected output
- Include reference implementation

### Step 6: Save JSON and Render Documents

**A) Create output directory:**

\`\`\`bash
mkdir -p ./.learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/
\`\`\`

**B) Write exercises.json:**

Use Write tool to save the JSON to:
\`./.learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/exercises.json\`

**C) Render documents via Bash:**

Run the Python scripts from exercise-generator. The scripts are located at:
\`C:/Users/Administrator/.claude/skills/exercise-generator/scripts/\`

Based on the output format parameter from Step 0:

**If format = "html":**
\`\`\`bash
python "C:/Users/Administrator/.claude/skills/exercise-generator/scripts/generate_html.py" \\
  ".learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/exercises.json" \\
  ".learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/<section>.html"
\`\`\`

**If format = "pdf":**
\`\`\`bash
python "C:/Users/Administrator/.claude/skills/exercise-generator/scripts/generate_pdf.py" \\
  ".learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/exercises.json" \\
  ".learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/<section>.pdf"
\`\`\`

**If format = "word":**
\`\`\`bash
python "C:/Users/Administrator/.claude/skills/exercise-generator/scripts/generate_docx.py" \\
  ".learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/exercises.json" \\
  ".learn/topics/<topic-name>/exercises/<domain-slug>/quiz-<section>/<section>.docx"
\`\`\`

**If no format specified (default):** run all three scripts.

**D) If Python scripts fail:**

If the scripts are missing or Python dependencies are not installed, fall back to presenting the exercises as inline text in the chat. Warn the user:
"Document rendering scripts are not available. The quiz has been displayed as text in the conversation. For PDF/Word output, please ensure Python and related dependencies (python-docx, fpdf) are installed."

### Step 7: Batch Generation (Parallel Agents)

When user requests \`/learn-quiz all\`:

1. Parse knowledge-map.md to identify all domains
2. Launch one Agent per domain:
   - Agent name: \`quiz-gen-<domain-slug>\`
   - Each agent independently generates exercises and renders documents
3. After all agents complete, provide a summary of all generated files

**Agent prompt template:**
\`\`\`
Generate a quiz for the domain "<domain-name>" in topic "<topic-name>".

Context:
- Knowledge map: <paste the domain section from knowledge-map.md>
- State: <paste relevant concept entries from state.yaml>
- Output directory: .learn/topics/<topic>/exercises/<domain-slug>/quiz-<section>/

Follow the learn-anything-quiz skill instructions. Generate exercises.json, then render PDF/Word/HTML using the Python scripts at C:/Users/Administrator/.claude/skills/exercise-generator/scripts/.
\`\`\`

### Step 8: Present Results

Display a summary to the user:

\`\`\`
Quiz generated! 📂 <domain>/quiz-<section>/

📊 Question Statistics:
  Multiple Choice: 5 questions (10 points)
  Fill-in-Blank: 5 questions (10 points)
  True/False: 5 questions (10 points)
  Error Correction: 2 questions (10 points)
  Coding: 2 questions (30 points)
  Total: 19 questions, 70 points

📄 Output Files:
  exercises.json — Question data
  <section>.docx — Word exam
  <section>.pdf  — PDF exam
  <section>.html — Interactive quiz

💡 Difficulty Distribution: 8 easy / 7 medium / 4 hard
\`\`\`

### Step 9: Record Session and Update State

**A) Write session file:**

Use Write tool to create:
\`./.learn/topics/<topic-name>/sessions/<domain>-quiz-<section>.md\`

\`\`\`markdown
# Quiz Session - <date>

## Quiz Details
- Topic: <topic-name>
- Domain: <domain-name>
- Concepts covered: <list of concepts>
- Question types: <types generated>
- Difficulty distribution: <easy/medium/hard counts>
- Total questions: <count>
- Total points: <points>

## Generated Files
- exercises.json
- <section>.docx
- <section>.pdf
- <section>.html
\`\`\`

**B) Update state.yaml:**

Use Edit tool to update each concept covered in the quiz:
- Increment \`practice_count\` by 1
- Update \`last_practiced\` to current date
- If concept was \`unexplored\`, change status to \`in_progress\`
- Add \`quiz_history\` entry if the field exists, or add it:

\`\`\`yaml
quiz_history:
  - date: 2026-06-07
    score: null  # will be updated when user completes the quiz
    total_questions: 19
    types: [multiple_choice, fill_in_blank, true_false, error_correction, coding]
\`\`\`

---

## Edge Cases

- **No topic exists**: "You haven't created a learning topic yet. Please run \`/learn <topic-name>\` to initialize."

- **Concept not found in knowledge map**: Fuzzy search. If no match: "'xxx' is not in the current knowledge map. Would you like to: 1) Generate a quiz for its domain 2) Add it to the knowledge map"

- **Non-coding topic**: Skip \`error_correction\` and \`coding\` question types. Only generate \`multiple_choice\`, \`fill_in_blank\`, \`true_false\`.

- **Very large domain (10+ concepts)**: Offer to split: "This domain has 12 concepts. Would you like to split into two quizzes or generate one large quiz?"

- **User wants quiz on a single concept only**: Allow it, generate a focused quiz with fewer questions (3 choice, 3 fill, 2 true/false, 1 coding).

- **Python scripts not available**: Fall back to inline text output. Suggest installing dependencies: \`pip install python-docx fpdf\`.`;

const COMMAND_NAME = 'Learn: Quiz';
const COMMAND_DESCRIPTION =
  'Generate formal quiz documents from the knowledge map — outputs PDF, Word, and interactive HTML';

const COMMAND_CONTENT = `Use the learn-anything-quiz skill to handle the user's /learn-quiz <concept-or-domain> request.
Follow the workflow defined in the skill:
0. Parse user request: determine target domain/concept and output format (html/pdf/word/all)
1. Load context: read knowledge-map.md and state.yaml from .learn/topics/<topic>/
2. Resolve scope: map request to specific concepts from knowledge map
3. Determine difficulty distribution based on average confidence from state.yaml
4. Determine question counts (default or custom from user)
5. Generate exercises.json with all question types (multiple_choice, fill_in_blank, true_false, error_correction, coding)
6. Save JSON → render documents via Python scripts (generate_html.py, generate_pdf.py, generate_docx.py)
7. For "all" requests: launch parallel agents per domain
8. Present results summary with statistics
9. Write session file → update state.yaml (practice_count, last_practiced, status)`;

export function getLearnQuizSkillTemplate(): SkillTemplate {
  return {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    instructions: INSTRUCTIONS,
    license: 'MIT',
    compatibility: 'Requires learn-anything CLI.',
    metadata: { author: 'learn-anything', version: '1.0' },
  };
}

export function getLearnQuizCommandTemplate(): CommandTemplate {
  return {
    name: COMMAND_NAME,
    description: COMMAND_DESCRIPTION,
    category: 'Learning',
    tags: ['learning', 'quiz', 'exam', 'assessment'],
    content: COMMAND_CONTENT,
  };
}
