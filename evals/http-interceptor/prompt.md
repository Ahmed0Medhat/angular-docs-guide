---
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

In an Angular 22 app, add an interceptor that attaches a bearer token from an AuthService to every API request except those flagged to skip auth, and retries failed GET requests up to 2 times. Show the provider setup and the interceptor.
