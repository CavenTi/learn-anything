## ADDED Requirements

### Requirement: Dashboard page shows all topics as cards

The system SHALL render a Dashboard page at the site root (`/`) that scans `.learn/topics/` for all topic directories, reads each topic's `state.json`, and displays each topic as a card showing the topic name, total concept count, mastered concept count, and a progress percentage.

#### Scenario: Dashboard with multiple topics

- **WHEN** `.learn/topics/` contains subdirectories `javascript/` and `python/`, each with a valid `state.json`
- **THEN** the Dashboard displays two cards, one for "JavaScript" with its progress and one for "Python" with its progress

#### Scenario: Dashboard with no topics

- **WHEN** `.learn/topics/` exists but contains no topic subdirectories with valid `state.json` files
- **THEN** the Dashboard displays a message indicating no topics have been started

#### Scenario: Dashboard with a topic that has no state.json

- **WHEN** `.learn/topics/` contains a subdirectory without a `state.json` file
- **THEN** the Dashboard skips that directory and does not display a card for it

### Requirement: Topic page shows knowledge map with domain sidebar

The system SHALL render a Topic page at `/topics/[slug]` that reads the topic's `state.json` and `knowledge-map.md`, displays a left sidebar listing all domains as navigation links, and displays the rendered knowledge map Markdown in the content area.

#### Scenario: Topic page with domains

- **WHEN** user navigates to `/topics/javascript` and `state.json` contains 6 domains
- **THEN** the sidebar lists all 6 domain names as clickable links, and the content area shows the rendered knowledge map

#### Scenario: Clicking a domain in the sidebar navigates to domain page

- **WHEN** user clicks a domain name in the sidebar
- **THEN** the browser navigates to `/topics/{slug}/{domain-slug}`

#### Scenario: Clicking a domain heading in the knowledge map navigates to domain page

- **WHEN** user clicks a domain heading (`## Language Basics`) in the knowledge map content area
- **THEN** the browser navigates to `/topics/{slug}/{domain-slug}`

### Requirement: Concept items are not clickable

The system SHALL render concept items in the knowledge map as plain text. Concepts SHALL NOT be clickable links.

#### Scenario: Concept item has no click behavior

- **WHEN** user sees a concept item like "Variables and Data Types" in the knowledge map
- **THEN** the item is displayed as text only with no hyperlink or click handler

### Requirement: Domain page has Notes and Exercises tabs

The system SHALL render a Domain page at `/topics/[slug]/[domain]` with two tabs: "Notes" (default) and "Exercises". The Notes tab SHALL list all Markdown session files in `sessions/<domain-slug>/` and display the content of the selected file. The Exercises tab SHALL list all exercise files grouped by concept from `exercises/<concept-slug>/`.

#### Scenario: Notes tab shows session file list

- **WHEN** user navigates to a Domain page and the Notes tab is active
- **THEN** the left panel lists all `.md` files from `sessions/<domain-slug>/`, sorted by filename (date descending), and clicking a file displays its rendered Markdown content in the right panel

#### Scenario: Default selection of first note

- **WHEN** user navigates to a Domain page with session files and the Notes tab is active
- **THEN** the first note file (by date descending) is automatically selected and its content is displayed

#### Scenario: Exercises tab shows exercises grouped by concept

- **WHEN** user switches to the Exercises tab
- **THEN** the system scans `exercises/` for subdirectories matching concepts in the current domain, and displays each matching concept's exercise files (README.md, starter code, solution, practice records) as a grouped card

#### Scenario: Exercises tab with no exercises

- **WHEN** user switches to the Exercises tab and no exercise files exist for any concept in this domain
- **THEN** the system displays a message indicating no exercises are available

### Requirement: Language switch toggles UI strings between EN and zh-CN

The system SHALL provide a language switch button in the site navbar. When toggled, all UI strings (navigation labels, tab names, status labels, messages) SHALL change between English and Simplified Chinese. Note content and exercise content SHALL NOT be affected.

#### Scenario: Switch from English to Chinese

- **WHEN** the current UI language is English and user clicks the language switch button
- **THEN** all UI strings change to Chinese and the button label changes to "English"

#### Scenario: Language persists across page loads

- **WHEN** user sets the UI language to Chinese and refreshes the page or navigates to another page
- **THEN** the UI language remains Chinese

#### Scenario: Language does not affect note content

- **WHEN** user switches the UI language
- **THEN** the content of session notes, knowledge map entries, and exercise descriptions is displayed exactly as stored, with no modification

### Requirement: TopicCard component displays topic summary

The system SHALL render each TopicCard with the topic name, domain count, total concept count, mastered concept count, a progress bar showing mastered/total ratio, and a visual indicator of the overall completion percentage.

#### Scenario: TopicCard with progress

- **WHEN** a topic has 4 out of 24 concepts mastered
- **THEN** the TopicCard displays "17% complete", a progress bar filled to 17%, and "4/24 mastered"

#### Scenario: TopicCard with no progress

- **WHEN** a topic has 0 out of 24 concepts mastered
- **THEN** the TopicCard displays "0% complete" with an empty progress bar

### Requirement: Status icons represent concept mastery levels

The system SHALL render concept status icons using distinct visual indicators for each status: "mastered" (green filled circle), "in_progress" (yellow filled circle), "needs_practice" (orange filled circle), and "unexplored" (gray empty circle).

#### Scenario: Icon for mastered concept

- **WHEN** a concept has status "mastered"
- **THEN** the system renders a green filled circle icon next to the concept name

#### Scenario: Icon for unexplored concept

- **WHEN** a concept has status "unexplored"
- **THEN** the system renders a gray empty circle icon next to the concept name
