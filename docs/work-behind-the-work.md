# Cyclefy: The Work Behind a Backend Learning Project

Building donation, barter, borrowing, recycling, and repair workflows while learning what makes a backend reliable.

## Overview

A borrowing feature sounds simple: someone offers an item, another person requests it, and the item eventually comes back. But the backend has to understand everything between those steps. Who can accept the request? What happens to competing requests? What if the return date changes? What should happen if only part of an update succeeds?

Cyclefy gave me a project where I could explore those questions through code.

I built its backend while learning and experimenting with backend development. It uses Node.js, Express, Prisma, and MySQL to support five related activities: donation, barter, borrowing, recycling, and repair. Accounts, contact details, uploaded images, notifications, and payment records connect those activities.

This is a story about that backend and what I can learn by looking at it honestly. The repository contains substantial feature work, but it also has unfinished flows and serious security and reliability problems. It is not ready for production use or real payments. Preparing it for my portfolio means explaining both sides clearly.

## The problem

The product idea is to give items more possible next steps. An item someone no longer needs could be donated or exchanged. Something needed temporarily could be borrowed. A damaged item could be repaired, and an item that cannot be reused could be sent for recycling.

From a backend perspective, these options create related but different problems. An exchange involves two people's items. A loan includes an availability window and a return deadline. Recycling needs a destination. Repair introduces a price and a payment.

The common foundation is ownership: an item belongs to someone, it has contact information, and certain actions should only be available to the right person. On top of that foundation, each activity needs its own rules.

That was a useful learning scope because it went beyond independent create, read, update, and delete endpoints. The interesting work was connecting requests into a process.

## My approach

The implementation is one application with a shared database. Routes lead to controllers, controllers call services, and services use Prisma directly.

I used a common set of account, address, phone, and category records across the five domains. Each domain has its own item records and status histories. Barter and borrowing also have application records to separate the person offering an item from the person requesting it.

For example, the borrowing model distinguishes the owner's availability window from the applicant's requested dates. That separation gives the backend enough information to compare the two periods and track the selected borrower.

There are no separate microservices or repository classes. Most of the business logic lives in service functions, including validation, ownership checks, database operations, and response mapping. This makes a request path relatively direct to follow, although it also creates some of the maintenance problems I describe later.

The backend includes integrations for email, social login, geocoding, default avatars, and repair payments. These added another kind of complexity: the result of a request can depend on a system outside my own database.

## Technical decisions and their tradeoffs

Looking back, I can explain what the design supports and where it creates problems. I do not want to present every choice as a carefully planned architecture decision; some parts clearly reflect exploration while I was learning.

### Express with routes, controllers, and services

The folder structure makes the main responsibilities visible. Routes define the HTTP surface, controllers extract request data and send responses, and services handle the domain operations.

The separation is incomplete, though. Services receive Express request objects for translations and image URLs. They combine business rules with presentation logic, and several functions have long lists of positional arguments. Similar implementations were repeated across domains instead of becoming well-defined shared components.

Today, I would keep the straightforward structure while making the boundaries clearer. A business operation should be easier to test without creating an HTTP request object.

### MySQL and Prisma for related data

The data is strongly connected: users own listings, applications belong to listings, and images and histories belong to their parent records. Prisma models make those relationships visible, while migrations describe the database structure.

The schema does not enforce every business rule. A foreign key can prove that an address exists, but it does not prove that the address belongs to the person submitting an item. The application has to check ownership separately.

Some seeders even bypass that rule by choosing contacts independently of the item owner. This is a reminder that valid database relationships and valid business data are not always the same thing.

### Status histories for longer workflows

Instead of keeping only a current status on most items, I store a series of status-history rows. That supports a timeline showing how a request progressed.

For borrowing, the owner and applicant see related states:

| Step | Owner's listing | Applicant's request |
| --- | --- | --- |
| Request accepted | Confirmed | Confirmed |
| Item handed over | Lent | Borrowed |
| Item returned | Returned | Returned |
| Process finished | Completed | Completed |

The difficult part is keeping both sides consistent. The code writes the histories separately, without a transaction. Several reads also make assumptions about which history is the latest.

A history table is useful, but it does not automatically provide a reliable state machine. That reliability has to come from explicit transition rules and protected updates.

### Saved addresses for nearby discovery

Address text is geocoded into coordinates. Discovery calculates the distance between a listing or recycling location and the user's saved addresses, then uses the smallest distance.

This is straight-line distance, not driving distance. It also represents the nearest saved address, not necessarily where the person is right now.

Much of the filtering and pagination happens after loading records into memory. The implementation is easy to follow with a small dataset, but it does not establish good performance at a larger scale.

### Local image storage and external services

Images are written to local directories, with paths stored in the database. This keeps the storage flow visible, but it introduces coordination problems. A database write and a file write do not succeed or fail together.

Repair payments create a similar boundary. The application stores a pending payment, sends a charge request to Midtrans when requested, and later handles payment notifications. A local status and an external transaction can disagree if a request fails or a notification is repeated.

These integrations made it clear that a backend needs a plan for uncertainty, not just a response for the successful case.

## Challenges that became visible in the code

### A valid action can lead to a dead end

Borrowing extensions are a concrete example. Extending a loan creates an `extended` status for the listing and application. However, the return endpoint accepts lent or overdue states, not extended.

The result is a gap between two individually implemented features: extending a loan can prevent the normal return action until another status change happens.

This is a source-level finding, not a story about a verified production incident. It shows why I need to test the sequence of actions as a whole, including the less common paths.

### An error response does not mean nothing changed

Barter and borrowing completion write their completed histories before creating a notification. That notification omits a required JSON field and can fail after the histories are saved.

The client receives an error, but the operation has already changed important data. Without clear transaction boundaries and retry behavior, repeating the request may create more confusion.

This changes how I think about API errors. The important question is not only what status code to send. It is also what state remains after the failure.

### Similar domains can drift apart

Donation, barter, borrowing, recycling, and repair share many patterns. The code repeats validation, upload handling, history queries, and image formatting across those modules.

Over time, those repeated patterns have different behaviors. Some return image strings, others return objects. Some use raw enum values, others use title-case labels. Error handling and pagination also vary.

Repetition made the differences easier to see during review. It points to a need for shared conventions, with reusable code where the behavior really is the same.

## What is still wrong or incomplete

I was still learning when I built Cyclefy. My understanding of authentication edge cases, concurrent writes, payment verification, and deployment was still developing. The repository reflects that period of exploration.

That context matters, but it does not make the defects harmless. The following issues are still present in the documented version.

### Security and authentication

The payment webhook has a signature helper, but the verification call is disabled. It also does not compare the notified amount with the stored payment or use the fraud decision. Duplicate or out-of-order notifications can change local state without the necessary safeguards.

Profile password changes return the new bcrypt hash because the service returns the database update object. OTPs use four digits and `Math.random()`, are stored directly, and have no attempt limit or resend cooldown. The reset-code verification endpoint ignores whether a code is expired or already used, even though the actual reset checks those conditions.

Issued JWTs are not revoked after a password change or account deactivation. Protected routes do not reload the current account status. OAuth has incorrect provider/email handling in some branches, and it does not consistently enforce activation. Credential-like values also remain in experimental source code; their validity has not been verified.

These issues need actual code changes and verification before the application should handle sensitive data or real payments.

### Business rules and consistency

Multi-step writes have no database transactions, and acceptance flows have no concurrency protection. Status histories can become inconsistent, and completion notifications can fail after changing state.

Borrowing has incomplete availability and duplicate-request checks, inconsistent date handling, and the extension/return gap described above. Reusing an existing barter item copies its fields without reserving it or synchronizing the source listing's lifecycle.

Recycling checks that a location exists but not that it accepts the item's category. Donation and recycling have no operational progression endpoints, and repair has no technician assignment or later repair-management flow. An account named Admin exists in the seed data, but there is no role-based authorization.

The payment retry behavior also differs from the API description: retrying a pending payment sends another gateway request, while failed or expired payments do not receive the promised replacement order. There is no reconciliation process to resolve missed notifications.

### API quality and maintainability

The code has missing imports in error branches, incorrect query fields, inconsistent translations, and image-helper calls that can return null or malformed URLs. Some invalid-token failures produce server errors. Certain nullable fields are treated as if they were always present.

The OpenAPI file has drifted from the routes and services. Response shapes, field names, status labels, and HTTP codes are not consistent enough for a dependable client contract.

Large service files, repeated logic, unused imports, commented experiments, and old package metadata make the repository harder to maintain than it should be.

### Uploads, testing, and operations

Uploads trust supplied MIME types and preserve original extensions. File-size limits and most count limits are missing, filenames can collide, and cleanup can leave files and database rows out of sync. Files live on public local disk.

The tests delete broad database contents without checking the target, omit newer tables during cleanup, create files, and call external services. Some assertions are weak or stale. Important acceptance, extension, concurrency, OAuth, and webhook cases lack coverage, and the application and tests use different Prisma import paths.

The application also has in-memory sessions, unvalidated environment values, hard-coded CORS, and a cron job started independently by every server instance. There is no pinned runtime, CI workflow, container setup, readiness endpoint, graceful shutdown, or completed production-monitoring setup. Seeds assume fixed IDs, append demo data, and randomly replace prices.

The repository's limitations document records these findings in greater detail, with affected files and remaining uncertainties. It covers the issues identified in the review; it is not a guarantee that every possible defect has been found.

## Outcome

The tangible result is a backend implementation connecting five item-reuse domains with accounts, contact information, histories, images, notifications, and repair-payment code. It contains 72 registered routes and 36 Prisma models, along with migrations, seeders, and an initial test suite.

Those numbers describe scope, not reliability. I am not presenting them as proof of a successful launch, user adoption, reduced waste, production payment handling, or performance at scale. Those outcomes were not established in this review.

The later documentation work explains the structure and workflows, records the defects, and identifies improvement priorities. Static JavaScript syntax checks passed, but the documentation review did not run the complete integration suite or verify the external services. Writing clearer documentation has not fixed the application.

For my portfolio, the result is a project I can discuss in depth: how its parts connect, what it implements, where it breaks down, and what I would change next.

## What I learned

The most useful lesson is that backend behavior needs to be understood across an entire flow. A valid extension must still allow a return. A successful status change must not become an ambiguous failure because a notification could not be saved. Two individually valid requests must not create an impossible combined state.

I also learned to separate responsibilities more carefully. A database relationship does not replace authorization. Password hashing does not make every response containing password data safe. A payment notification is a claim that needs verification. An API document is only useful when it agrees with the implementation.

Testing is another area where my perspective has changed. Having test files is a beginning. Meaningful confidence requires controlled data, predictable time and external dependencies, strong assertions, and coverage of failures and competing requests.

Finally, reviewing Cyclefy has helped me be more precise about tradeoffs. Local files, direct Prisma access, and a single application can be reasonable starting points. Missing payment verification, leaked hashes, and contradictory transitions are defects to fix. I should be able to explain the difference without using the project's learning context to hide it.

## Why I am including Cyclefy in my portfolio

Cyclefy represents a stage in my development where I was connecting many backend concepts through a concrete project. Its limitations are part of that story, and leaving them visible gives me a more useful way to show my progress. I want this project to show that I can explain my work honestly, read beyond the successful request path, and identify the engineering work that remains.
