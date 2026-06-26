# Security Specification

## Data Invariants
- A shift must belong to a valid user.
- A task must have a title, assigned user, and valid status.
- Time logs must be associated with both a user and a task.
- Users can only see their own shifts/tasks unless they are a Manager or Admin.
- Admins/Managers have broad visibility for auditing and reporting.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Spoofing**: Attempting to create a shift for `user_id: 'someone_else_uid'`.
2. **Privilege Escalation**: An intern attempting to update their `role` to 'admin'.
3. **State Shortcutting**: Marking a task as 'completed' without any logged hours (handled by logic, but rules should prevent unauthorized field updates).
4. **Shadow Field Injection**: Adding `isVerified: true` to a user profile.
5. **PII Leak**: An intern attempting to list all users' emails/phones.
6. **Orphaned Writes**: Creating a time log for a task that doesn't exist.
7. **Negative Hours**: Submitting a shift with `-5` net work hours.
8. **Future Clock-In**: Setting `clock_in` to a future date.
9. **Terminal State Bypass**: Updating a 'rejected' time log without manager intervention.
10. **Resource Positioning**: Injecting a 2MB string as a task description.
11. **ID Poisoning**: Using a 1KB string of special characters as a `shiftId`.
12. **Unverified Auth**: Performing writes without `request.auth.token.email_verified == true`.

## Proposed Improvements to Rules
- Hardening `isManager` and `isAdmin` to handle potential nulls or path issues.
- Explicitly separating `users` access: Public profiles (minimal) vs Private PII.
- Ensuring `list` operations are strictly guarded by `resource.data` checks that match client queries.
- Adding `isValidId` and type/size checks to all fields.
- Centralizing `isValidEntity` helpers.
