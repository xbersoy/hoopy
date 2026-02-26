# Feature Specification: Contact Information Management in HRIS

## Objective

The goal is to introduce a flexible, scalable, and normalized structure for storing multiple types of contact information (emails, phone numbers, social profiles, etc.) for users in the HRIS system. This feature should support storing multiple contact entries per user and allow classifying them with types and labels, as well as marking one as primary if needed.

## Background

In the current system, user contact details are not structured in a way that allows extensibility. A user may have one or more phone numbers, email addresses, or other forms of contact. Embedding these directly in the `users` table leads to a rigid and hard-to-maintain schema. Therefore, this feature proposes a new `contacts` table associated with the existing `users` table.

## Requirements

1. Create a new entity called `Contact`.
2. Each contact must be associated with a user.
3. A user may have multiple contacts.
4. Each contact must have:
   - A `type` field that defines whether the contact is an email, phone, LinkedIn, emergency phone, or another method.
   - A `value` field that stores the actual contact information (e.g., phone number or email address).
   - An optional `label` field to describe the contact (e.g., "work", "personal", "emergency").
   - A boolean `isPrimary` field that can be set to true to indicate the primary contact method of its type.
   - Created and updated timestamps.
5. If a user is deleted, all of their associated contacts must be deleted as well (cascade delete).
6. There should be an index on `(user, type, isPrimary)` to optimize primary contact lookups.

## Acceptance Criteria

- The system must allow adding multiple contacts per user.
- The system must allow querying all contacts for a given user.
- The system must allow marking one contact per type as the primary contact.
- The system must not require schema changes to support new contact types.
- Contacts must be safely removed when the associated user is deleted.

## Business Rules

- There can be multiple contacts of the same type (e.g., work and personal email).
- Only one contact per type should be marked as primary. This should be enforced at the application level.
- The list of supported types should be predefined but flexible for future extensions. Suggested types include: email, phone, emergency_phone, linkedin, other.
- The label field is optional and used for clarification, not classification.
- Primary contact flags (`isPrimary = true`) should be considered for features like notifications or account recovery.

## Future Considerations

- A UI page for contact management where admins or users can view, add, edit, or remove contact details.
- Validation rules per contact type (e.g., valid email format, valid phone number).
- Possibly introduce contact categories like "emergency contacts" with additional fields such as name and relationship.

## Deliverables

- A new persistent model representing contact information.
- A migration script to create the `contacts` table with all required fields and constraints.
- Modification to the `User` model to support one-to-many relation with `Contact`.
- Proper indexing and foreign key constraints.
- Optional service methods to get all contacts, get contacts by type, and get the primary contact of a specific type.

## Timeline

This feature should be implemented in one sprint and thoroughly tested for:
- Adding multiple contact entries.
- Deleting a user and cascading contact deletions.
- Setting and updating the primary contact.
- Querying all contact data per user efficiently.