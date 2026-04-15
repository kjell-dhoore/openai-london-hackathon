# SkillPilot End-to-End Application Flow

## 1. Entry Point: New User Lands in the Application

When a new user opens SkillPilot for the first time, they should not immediately land on a generic dashboard. Instead, they enter a guided onboarding experience that clearly communicates the purpose of the platform:

SkillPilot helps junior engineers understand their current skill profile, identify targeted growth opportunities, and receive personalized recommendations based on internal and external knowledge sources.

The first screen should feel welcoming, polished, and intelligent. It should explain in a simple way that the platform will build a learner profile and use that profile to generate a tailored growth path.

The user should see a clear call to action such as:

**Build my profile**

This is the start of the onboarding flow.

---

## 2. Learner Profile Creation

The learner profile creation flow is the foundation of the whole application. It should feel lightweight, smart, and fast.

### 2.1 Resume or CV Upload

The first onboarding step allows the user to upload a resume or CV. There can also be an alternative option to paste text or provide a short professional summary.

The goal of this step is to extract an initial picture of:

* technical skills
* prior experience
* project exposure
* areas of likely strength
* possible growth gaps

The interface should make it clear that this information will be used to personalize the experience.

Example supporting text:
“We’ll analyze your experience to understand your current skills and generate a personalized growth plan.”

### 2.2 Additional Profile Fields

Because a resume alone is never enough, the user is then asked for a few structured profile details, such as:

* current role
* years of experience
* target role
* current focus or ambition

This helps the system position the user relative to where they are now and where they want to go.

### 2.3 Quiz to Fill in the Gaps

After resume analysis, the application presents a short adaptive quiz. This quiz exists to fill in information that the resume does not make explicit.

The quiz should be brief and targeted. It should not feel like a formal assessment. Instead, it should feel like a smart profile refinement step.

Examples of question themes:

* comfort level with deploying models
* familiarity with evaluation metrics
* experience with APIs and backend services
* collaboration habits
* preferred learning style
* time available per week for growth

This step helps the app refine confidence in the learner profile.

### 2.4 Profile Generation State

Once the user completes the resume upload and quiz, the application transitions into a short “profile generation” moment.

This is an important experience from a UX perspective. It creates the sense that the system is synthesizing multiple signals and building something personalized.

The screen can show progress messages such as:

* extracting skills
* identifying growth opportunities
* mapping strengths
* preparing your growth path

This should feel dynamic but not overly theatrical.

---

## 3. Generated Learner Profile Summary

Before dropping the user directly into the main app, SkillPilot should show a profile summary.

This screen builds trust. It proves that the system understood something meaningful about the user.

The summary should include:

* detected strengths
* likely growth areas
* current maturity snapshot
* target direction

For example:

* Strengths: Python, experimentation, prototyping
* Growth areas: production ML, observability, architectural thinking
* Goal direction: move from junior ML engineer toward a more autonomous delivery profile

This screen should also explain that the upcoming recommendations and growth path are based on:

* uploaded profile information
* quiz answers
* selected knowledge sources
* target growth direction

The main CTA here is something like:

**Generate my growth plan**

---

## 4. Source Selection and Source Management

A key part of the product concept is that recommendations are generated using a mix of internal and external knowledge sources.

This means the user needs a way to understand and manage which sources are contributing to their recommendations.

### 4.1 Initial Source Selection

During onboarding, or immediately after the profile summary, the user should be able to choose which knowledge sources are active.

Examples of internal sources:

* Confluence project documentation
* GitHub PR feedback
* Google Drive learning materials
* coaching notes
* mentorship notes
* project delivery assets

Examples of external sources:

* blog posts
* documentation
* papers
* videos

The user does not need to configure everything in depth. The UX should keep it simple, with clear grouped toggles and short explanations.

### 4.2 Ongoing Source Management

Later in the application, there should be a dedicated source management page where users can:

* enable or disable sources
* understand what each source is used for
* see whether a source informs recommendations, profile analysis, or both
* prepare for future extensibility as new sources are added over time

This is important because the platform should clearly feel extensible, even if the hackathon demo only uses a subset of sources.

---

## 5. Main Dashboard

After onboarding and growth plan generation, the user lands on the dashboard. This is the operational home of the application.

The dashboard should answer three immediate questions:

* Where am I now?
* What should I do next?
* How am I progressing?

### 5.1 Dashboard Content

The dashboard should prominently display:

* welcome message
* current level
* XP progress bar
* current focus area
* active growth path summary
* next recommended action
* small progress stats such as streak, completed tasks, or active goals

The most important element on the page is the **next best action**.

This should not feel like a generic suggestion. It should feel specific, contextual, and justified.

For example:
“Review the Helios deployment pattern and summarize how environment promotion is handled.”

The dashboard is designed to reduce friction. The user should never have to wonder what to do next.

---

## 6. Skill Profile View

From the dashboard, the user can explore their skill profile in more detail.

This page gives a structured overview of how the system currently sees the user.

### 6.1 Strengths and Growth Areas

The profile should be split into two main sections:

* strengths
* growth opportunities

Each skill area can be shown with a level indicator, confidence band, or maturity marker.

Examples:

* Python and experimentation: strong
* API design: developing
* observability and reliability thinking: emerging
* system design communication: growth area

### 6.2 Evidence and Context

What makes this page valuable is the presence of evidence.

For each skill or growth area, the app can reference signals such as:

* positive or negative PR review patterns
* coaching feedback themes
* project documentation topics
* user-provided background
* learning preferences

This helps the user trust the profile rather than perceive it as arbitrary.

### 6.3 Target Role Comparison

If included, the app can also compare the current profile against the selected target role.

For example:
“You already show strong implementation ability, but to grow toward a medior profile you need stronger architectural reasoning, reliability awareness, and delivery tradeoff communication.”

This makes the experience feel developmental rather than evaluative.

---

## 7. Growth Path Generation

The growth path is the core output of the platform.

Instead of dumping a long list of resources, the app should create a structured learning journey.

### 7.1 Structure of the Growth Path

The growth path should contain 3 to 5 priority growth themes.

Each theme should include:

* a short explanation of why it matters
* a set of milestones or tasks
* estimated effort
* recommended sequence

Examples of growth themes:

* production ML and deployment discipline
* observability and failure-mode awareness
* architectural reasoning
* explainability and user trust in AI systems
* communication of technical tradeoffs

### 7.2 Why This Path Was Chosen

This is a critical part of the UX.

The system should explicitly explain why these themes were prioritized.

For example:
“This path was generated because your profile shows strong implementation skills, while recent feedback and project evidence suggest growth opportunities in production robustness and system design communication.”

This explanation should appear at the top of the growth path page.

### 7.3 Current Step Highlighting

The growth path should not be static. It should show where the user currently is.

The active milestone or current focus step should be highlighted so that the user knows what matters now.

---

## 8. Recommended Task Detail

Each growth path should break down into concrete tasks. The most important of these becomes the next recommended action.

When the user opens a task, they should enter a dedicated task detail page.

### 8.1 Task Information

The task page should include:

* title
* short description
* estimated effort
* related growth area
* XP reward

### 8.2 Why This Was Recommended

This is one of the most important sections in the whole product.

The app should explain why this task is being recommended now, based on:

* learner profile
* recent signals
* selected data sources
* target growth direction
* learning preferences

For example:
“This task is recommended because your recent code review feedback indicates a need to strengthen observability thinking, and your preferred learning style is hands-on with real project examples.”

This makes the task feel intentionally chosen.

### 8.3 Learning Resources

The task should link to a curated mix of internal and external resources.

Internal examples:

* Confluence project documentation
* Google Drive best-practice docs
* PR review excerpts
* coaching guidance

External examples:

* technical blog
* official docs
* short video
* research paper

The page should make it clear that these resources were selected because they fit both the topic and the user profile.

### 8.4 Expected Outcome

The task should define what success looks like.

For example:

* understand how a production deployment flow is structured
* identify 3 observability best practices from a real project
* summarize tradeoffs in a documented architecture decision

This reinforces progress and helps the task feel practical.

### 8.5 Completion Action

The page should include a clear completion CTA such as:

* mark as complete
* submit reflection
* continue to next step

This completion action should update progress and XP.

---

## 9. Progress, XP, and Gamification

SkillPilot includes light gamification to make growth feel rewarding, but it should remain professional and tasteful.

### 9.1 XP and Levels

Every completed task contributes XP. XP should feed into a visible level progression system.

This creates momentum and helps users see that growth is cumulative.

### 9.2 Streaks and Consistency

The app can also show lightweight streaks or consistency indicators, such as:

* tasks completed this week
* active learning streak
* current focus track

These elements should support motivation but never dominate the interface.

### 9.3 Recognition

Optional lightweight badges can exist for milestones such as:

* first growth path completed
* consistency streak reached
* production ML milestone completed

In the broader product vision, this could later connect to company recognition or rewards, but for the MVP it is enough to show visible progress and achievement.

---

## 10. Preferences and Personalization

Users should be able to configure how the platform guides them.

The preferences page allows the user to shape the recommendation style.

### 10.1 Learning Preferences

The user can define preferences such as:

* hands-on
* reading
* video
* discussion

### 10.2 Time Preferences

The user can indicate:

* available hours per week
* preferred cadence
* desire for weekly suggestions or nudges

### 10.3 Goal Focus

The user can express what kind of growth they want:

* career growth
* mastery
* exploration
* delivery impact

### 10.4 Cognitive Preference

The user can choose styles such as:

* theory first
* practice first
* structured
* exploratory

These settings should influence task recommendations and resource selection over time.

---

## 11. Source Management Page

Separate from general preferences, there should be a dedicated source management area.

This page exists because the platform is explicitly designed to evolve over time as more internal and external knowledge sources are connected.

The page should allow users to:

* view all available sources
* enable or disable them
* see what type of content each source contains
* understand what purpose each source serves

For example:

* Confluence: learn from delivered project design decisions
* GitHub: learn from review feedback and implementation patterns
* Google Drive: learn company-wide best practices
* Coaching notes: reflect strategic and technical mentorship
* External resources: complement internal learning with broader context

This page reinforces transparency and user control.

---

## 12. Returning User Experience

Once onboarding is complete, returning users should not repeat profile creation.

When they come back, they land directly on the dashboard with:

* current progress
* active growth path
* latest recommendation
* pending tasks
* refreshed insights if new signals are available

The application should feel like an ongoing coach, not a one-time assessment.

---

## 13. Overall Product Experience

End to end, the application should feel like a personalized internal growth coach.

The user journey should communicate the following logic clearly:

1. The platform understands who the learner is
2. It combines profile data with internal and external knowledge
3. It identifies targeted growth opportunities
4. It turns those into a structured, explainable path
5. It guides the learner toward one actionable next step
6. It rewards progress and supports continuous development

The experience should feel:

* intelligent
* supportive
* trustworthy
* practical
* enterprise-ready
* slightly gameful, but not childish

---

# Condensed User Flow Summary

A new user enters SkillPilot and uploads a resume. The system asks a few additional questions and a short adaptive quiz to fill in missing information. It then generates a learner profile, showing strengths, growth areas, and target direction. The user selects which internal and external knowledge sources should inform recommendations. Based on this profile and the selected sources, the system generates a personalized growth path. The user lands on a dashboard where the next recommended task is clearly highlighted. They can inspect their skill profile, browse the generated path, open a recommended task, understand why it was chosen, complete it, and gain XP. Over time, they can update preferences, manage sources, and continue progressing through increasingly relevant growth steps.

If you want, I can turn this into a **Google Docs-friendly product spec** with headings like “Goal,” “Actors,” “Primary Journey,” “Screens,” and “Functional Requirements.”
