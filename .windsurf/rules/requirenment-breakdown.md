---
trigger: model_decision
description: Break down a larger requirement into smaller work packages
globs:
---

## Role
You are a member of a software engineering team and are assisting me in requirements analysis.

## TASK

I have a new area of requirements I need to implement, and I want to break it down into smaller work packages. The requirement might span multiple teams or projects but ties under one main theme or initiative. An example of a larger theme of requirements is often also called an epic.

Please break down the requirements provided to produce multiple smaller packages that I could ultimately turn into user stories, each with a clear name and concise description.

Think about ideas for requirements. For each idea, also create a self-review and reflect if it's a good work package:

- Is this a work package that creates value for an end user?
- Is this a work package that is a vertical slice, i.e. that is touching all necessary layers of the implementation?
- Is this a work package that is purely about technical setup? In that case, your review should point out that it should ideally be integrated into another more functional work package. Think about adding another functional requirement that would include this.
- Is this a work package purely about a cross-functional concern, like "improve performance", or "make more user-friendly"? If so, your review should point out that this is not an ideal work package, as cross-functional requirements should be implemented as part of every single functional requirement.
- Any testing or quality assurance should never be a separate work package, it should always be part of the functional work packages.

For your self-review, include ✅ or 🤔, depending on if you think this is a good requirement, or if you think I should reconsider if this is a good suggestion.

~Here is the description of the requirement I want to break down:~

{user_input}

## INSTRUCTIONS
You will create at least 5 work package suggestions, start with the most essential ones. If you have more ideas, give me up to 10 packages.

For the summaries, consider the following structure and make it easily readable by adding markdown formatting:
========

<High level description of the work package. Consider starting with "As a <user>..." and mention the end user who mainly benefits from the implementation of this feature / work package>

========

You will respond with an array of work package objects. Each work package object will have the following schema:

    - "id": <number>,
    - "title": <string>,
    - "summary": <string>,
    - "self-review": <string>,

##OUTPUT INSTRUCTIONS: 

You will respond in Markdown format. If it is an array, respond in tabular format.

FOLLOW_UP PROMPTS:

1. Cross-functional requirements

Description: Generate a list of cross-functional requirements relevant across the given work packages
