# Known Limitations and Improvement Priorities

[Documentation index](README.md) · [Project README](../README.md)

## Why this document exists

Cyclefy was built while learning and experimenting with backend development. That context explains the project's history, but it does not remove the need to acknowledge its weaknesses. This register records the problems found during source review so that the portfolio presents the work honestly.

**The items below remain open.** This documentation update fixes none of them. The project should not be used for real payments or sensitive production data in its current state.

The findings are based on source tracing and static checks, not a running deployment or a complete security audit. A source-level defect is distinguished from a concern that still needs runtime verification. No list of findings can guarantee that every possible defect has been discovered.

## Learning context and responsibility

I built Cyclefy while I was still learning how to connect a backend's parts. My understanding of reliable state changes, authentication edge cases, payment verification, and deployment was still developing. The code includes experiments and incomplete implementations from that period.

Looking back, the gaps show where my understanding needed to go further: from validating one request to handling concurrent requests, from storing a payment to verifying its source, and from writing tests to making them isolated and meaningful. These are lessons I can identify from the implementation today, rather than claims that every original choice was a deliberate tradeoff.

The learning context explains the project without excusing its security or correctness defects. This register does not attribute them to an invented deadline, team constraint, client requirement, or production incident. The README highlights the major findings, this document records their details, and the [portfolio story](work-behind-the-work.md) reflects on what they taught me. No listed issue is fixed by writing about it.

## Payment security and correctness

Sources: [payment notification controller](../src/controllers/paymentNotificationController.js), [repair service](../src/services/repairService.js), [payment schema](../prisma/schema/transaction.prisma).

| Finding | Current effect |
| --- | --- |
| Signature verification is disabled | The public webhook looks up an order and trusts the submitted payment state without verifying the sender |
| No stored-amount comparison | The handler does not compare the notified gross amount with the payment total |
| Fraud status is ignored | `capture` is mapped to paid without using the supplied fraud decision |
| No idempotency or transition protection | Duplicate paid notifications append duplicate confirmed histories; later notifications can replace terminal payment states |
| Unknown gateway statuses map to pending | Unexpected statuses can move local payment state back to pending |
| Payment timestamps can be cleared | Updates clear `paid_at` for non-paid states and `expired_at` for non-expired states, including pending/paid callbacks |
| No gateway reconciliation | Payment-status reads use only local data; no job corrects missed callbacks |
| Retry behavior differs from the specification | Another charge request is sent for pending payments; expired/failed/cancelled payments are rejected instead of creating a new order. Actual gateway behavior was not verified |
| Payment selection is inconsistent | Some reads select the latest payment; others use the first relation row without ordering |
| Bank checks happen after the gateway call | An unsupported local bank option may reach the external service before rejection |
| Payment input validation is limited | E-wallet types are passed through; there is no complete Joi payment-request schema |
| Amount calculation has no rounding policy | A floating-point weight can produce a fractional amount for an integer database field |
| Timezone parsing is inconsistent | Charge expiry uses an Asia/Jakarta conversion helper; webhook timestamps use direct JavaScript date parsing |
| Customer details include wrong fields | The charge reads `repair.user.phone`, which is not loaded as such, and maps city/state into mismatched billing fields |
| Provider errors and responses are handled inconsistently | Raw responses are logged; string gateway status codes can fall back to HTTP 500 in the error middleware |

The webhook's signature helper exists, but its invocation is commented out. This is an unresolved security defect, not a sandbox security control.

## Authentication and authorization

Sources: [auth service](../src/services/authService.js), [user service](../src/services/userService.js), [auth helpers](../src/helpers/authHelper.js), [JWT helper](../src/helpers/jwtHelper.js), [auth middleware](../src/middlewares/authMiddleware.js), [Passport](../src/application/passport.js).

- **Password hashes are returned after profile password updates.** The service hashes the new password, writes it, then returns the same update object to the controller.
- OTPs contain four digits, use `Math.random()`, and are stored directly. There is no attempt limit, resend cooldown, or route-level rate limiter.
- Sending another OTP does not invalidate previous unused codes. Verification/reset user writes and code-consumption writes are separate operations.
- The reset-code verification endpoint ignores expiry and usage, and returns the code in its response. The actual reset endpoint checks both conditions.
- JWTs remain valid for seven days. Password changes, account deactivation, and logout do not revoke them; no logout/revocation or refresh-token flow exists.
- Protected routes trust the JWT payload without reloading the user's current activation/verification state.
- Invalid/expired JWT errors use an undefined status field and normally become HTTP 500. Another branch constructs `ResponseError` with a comma expression instead of separate arguments.
- OAuth login does not enforce account activation. Matching is based on email rather than consistently resolving provider identity.
- Facebook reads `profile.email` while the other strategies use the plural email field. This requires correction and provider-profile verification.
- Facebook/Twitter existing-unverified-user branches save their provider under `google`. Existing verified accounts skip provider-record upserts.
- OAuth accounts receive an unhashed random placeholder password, which is inconsistent with the normal bcrypt password model.
- OAuth failure redirects go to `/login`, which is not implemented in this backend. Account updates can return the older in-memory user object to the callback.
- All OAuth strategies initialize unconditionally, even when the corresponding feature is not needed locally.
- Some auth responses reveal whether an email is registered. There is no unified account-enumeration policy.
- Services check ownership, but there is no role-based authorization. The seeded Admin account is an ordinary user.
- Username validation does not constrain path characters, while avatar filenames incorporate usernames. Path containment and filename safety need explicit enforcement.

## Data integrity and workflow state

Sources: [barter service](../src/services/barterService.js), [borrow service](../src/services/borrowService.js), [notification service](../src/services/notificationService.js), and the [schema](database.md).

- No application `$transaction` calls protect multi-step operations. Item creation, histories, images, payments, OTP consumption, and notifications can partially succeed.
- Acceptance uses read-then-write status checks without locking or a uniqueness invariant for the accepted application. Concurrent requests can select competing applications.
- Some status histories are read without ordering and treated as chronological. Many ordered queries use only `created_at`, with no deterministic tie-breaker.
- Some application lookups use a historical `some: { status: ... }` condition and then inspect the selected row's latest status. They can select an unsuitable application before finding the active one.
- Several paths assume nonempty histories. Partially created records can cause indexing or string-conversion errors.
- Completion notifications for barter and borrowing omit `messageData`, while the schema requires `message_data`. Histories are saved before the notification insert, so an error can be returned after completion has already happened.
- `updated_by` is often omitted; payment confirmation attributes the event to the paying user. Audit attribution is incomplete.
- Addresses/phones are shared live records rather than snapshots. Updates change the contact data displayed for past activities.
- Foreign keys establish existence, not ownership. Some seeders associate items with another user's address or phone.
- Application duplicate checks and phone-number duplicate checks are not backed by equivalent database constraints. Recycle-location/category pairs also have no composite uniqueness constraint.

## Business-rule gaps

Sources: [barter applications](../src/services/barterApplicationService.js), [borrow applications](../src/services/borrowApplicationService.js), [borrow service](../src/services/borrowService.js), [recycle service](../src/services/recycleService.js), and [routes](../src/routes/api.js).

| Area | Gap |
| --- | --- |
| Barter reuse | An existing listing is copied without storing a source link, reserving it, or updating it after exchange; its availability check is commented out |
| Barter duplicates | Existing-item duplicate detection uses item name; manual offers have no equivalent prevention |
| Request decline | Declining the final application leaves the parent waiting for confirmation |
| Borrow submission | The requested listing's availability state is not enforced, and overlap/duplicate checks are commented out |
| Borrow discovery | `duration_from >= now` excludes listings whose availability has already started |
| Borrow dates | Posting stores the original end timestamp while applications/extensions normalize to end of day; duration calculations also differ by endpoint |
| Borrow extension | Both records become extended, but return and immediate further extension reject that state |
| Borrow lifecycle | Acceptance cancels all competing applications, even for different periods; completed listings are not reopened for another loan |
| Category validation | Active categories are listed, but inactive categories can still be referenced during creation |
| Recycling | Location existence is checked, but whether it accepts the item's category is not |
| Donation/recycling operations | No operational confirmation, completion, cancellation, pickup, or recipient-management routes exist |
| Repair operations | No technician assignment, warehouse management, under-repair, completion, or failure-management routes exist |
| Notifications | Acceptance, rejection, and overdue transitions do not notify users; completion notification attempts fail as described above |
| News | Articles can be read, but there are no authoring, editing, publishing, or permission-management endpoints |

Product decisions are needed before treating every missing workflow as a feature to implement. For example, repeated lending and synchronized source barter listings may require changes to the data model.

## API defects and inconsistent responses

Sources: [user service](../src/services/userService.js), [file helper](../src/helpers/fileHelper.js), [news service](../src/services/newsService.js), [repair history](../src/services/repairHistoryService.js), [borrow history](../src/services/borrowHistoryService.js), [address service](../src/services/addressService.js), and [controllers](../src/controllers).

- Profile upload and news image mapping call `getPictureUrl` with only the path. Its second argument is missing, so it returns null.
- Current-user profile URL generation prefixes external URLs with the backend origin. Other call sites have inconsistent HTTP/HTTPS checks, including incorrect handling of plain HTTP URLs.
- Some profile paths call `startsWith` on a nullable database field. Optional repair image types are also passed to a string helper without a null guard.
- The avatar helper uses an unimported `logger` in its failure branch, breaking the intended recoverable fallback.
- `ResponseError` is not imported where used in the news service and barter-application, borrow-history, and recycle-history controllers. A not-found or invalid-ID branch can become a ReferenceError.
- Repair history assigns the `repairType` filter to `repair_location`. Its category filter expects numeric IDs, while OpenAPI documents names.
- Borrow application history filters a direct `category` relation that does not exist on `BorrowApplication`.
- Address patch always geocodes `updateData.address`, even when the request only changes the label. Empty address/phone patches are accepted by their schemas.
- Phone update does not enforce the duplicate rule applied on creation. Username uniqueness errors during profile updates are not mapped to a dedicated client error.
- Parameter validation is uneven: positive integer IDs, enum query values, dates, and pagination are not consistently enforced. Some controllers accept invalid or negative page/size values; none applies a shared maximum size.
- List status values vary between raw enums, title-case strings, and nested objects. Images vary between strings and objects; donation/recycle creation uses `image` in places where other responses use `images`.
- Donation detail and barter discovery return 201 for reads. Borrow extension returns a creation message. Some address fields use misspelled or nonexistent names, such as `latitue` or `address.name`.
- Notifications return `notifications` and `total`, unlike ordinary lists. The 404 handler also uses a different envelope.
- Raw unexpected error messages can be exposed to clients. SMTP response codes are reused as HTTP codes without a dedicated mapping. JSON-parser errors occur before i18n is initialized, while the error handler assumes `req.__` exists.
- Localization relies partly on matching Joi message strings. Missing keys include `validation.confirm_password_missmatch`, `notification.mark_all_as_read_successful`, `borrow.forbidden`, `borrow.no_confirmed_application`, and `borrow.cannot_mark_returned`.
- Status descriptions mix translation keys, already translated text, and free text. Historical extension descriptions derive dates from mutable application data rather than an immutable event payload.

News and repair searches also use `mode: "insensitive"` while the configured database is MySQL. Compatibility with the generated client was not verified and needs a runtime/client check.

The [API guide](api.md#openapi-differences) lists specific differences between registered routes and the OpenAPI document.

## Uploads, performance, and operations

Sources: [upload middleware](../src/middlewares), [web application](../src/application/web.js), [environment module](../src/application/env.js), [main entry point](../src/main.js), and [logging](../src/application/logging.js).

- Upload filtering trusts the supplied MIME type and preserves the original extension. There is no file-content verification or image-size limit; most image arrays have no file-count limit either.
- Filenames generally combine a user ID and millisecond timestamp. Multiple files of the same type/extension can collide. Repair filenames include the field name but can still collide within a group.
- Uploaded files are public, locally stored, and not shared across replicas. There is no durable object storage or lifecycle cleanup for unused files.
- Cleanup is inconsistent. Some controllers delete files after a database failure but leave image rows; repair creation does not implement cleanup. Database and filesystem state can diverge.
- Bank images are present, but the seeded URLs and static mounts do not match. Borrow-application upload middleware is unused.
- Many discovery/history queries load all matching records and relations before filtering/pagination. Per-image writes are commonly sequential.
- The schema lacks explicit composite indexes for latest-status and notification-list access patterns. Existing foreign-key/unique indexes do not replace a workload review.
- Every running server starts its own hourly overdue job, with no lock, durable scheduling, or replica coordination.
- Express sessions use the default in-memory store and default cookie options. There is no explicit production cookie/proxy configuration.
- CORS origins are hard-coded. Absolute asset/notification URLs depend on host/protocol handling, and notification redirects point to backend endpoints.
- Environment values are not validated at startup. SMTP booleans remain strings, some configuration flags are unused, and integrations are initialized eagerly.
- There is no graceful shutdown, readiness/liveness route, request correlation, access logging, or persistent log configuration. Console and Winston logging are mixed.
- Experimental source/helper code contains credential-like literals. Their validity is unknown; remove them and rotate/revoke any real credentials before publication or deployment, including exposure in earlier history if applicable. Values are intentionally not reproduced here.
- The unauthenticated geocoding test route remains exposed and can trigger external geocoding requests.

## Tests, seeds, tooling, and metadata

Sources: [tests](../test), [test utilities](../test/testUtils.js), [seeders](../prisma/seeders), [package.json](../package.json), and [gitignore](../.gitignore).

- Test cleanup deletes broad table contents without checking the database target. It omits notifications/news and can fail on foreign keys. Categories/prices are retained, so tests can depend on earlier data.
- Test utilities import `@prisma/client`, but the app imports a custom generated client. Prisma CLI/client versions also differ in the lockfile.
- Tests invoke live email/avatar/geocoding/payment integrations and create dummy files. They are not isolated or deterministic, and no dedicated test environment is automatically loaded.
- Assertions often check response shape rather than business outcomes. Some accept both 200/201, a repair-price test expects 18358 despite a 10000 default fixture, and a recycle-history setup omits the required location without checking creation success.
- Invalid-OTP tests use a fixed code that could match a randomly generated OTP. There is no controlled clock or randomness.
- There are no meaningful tests for the most important acceptance, completion, extension, webhook, and concurrency cases. OAuth, news, and notifications also lack coverage.
- Seeders append records, assume fixed IDs, create demo credentials, and generate random prices or mismatched contacts. They are not a reliable production bootstrap process.
- `railwayTest` combines installation, migration, and seeding. It does not run tests or start the app. Prisma CLI and Faker live in dev dependencies even though this script needs them.
- No runtime version, lint/format configuration, CI workflow, Dockerfile, Compose file, or deployment manifest is provided. `.gitignore` even excludes `.dockerignore` and `Dockerfile.dev` if later added.
- Duplicated services/upload handlers, unused imports/dependencies, long positional argument lists, commented implementations, and copied messages make maintenance harder. Services depend on Express request objects for presentation logic.
- Naming is inconsistent: Cyclefy/Cyclefi, `RepaiImageType`, misspelled upload filenames, and the original `REAME.md`. The documentation adds a canonical README, but does not rename source symbols.
- Package name/description still describe a contact-management API. Package metadata declares ISC, but no standalone license file is present.
- OpenAPI includes incorrect path/query names, missing operations/responses, and payment retry behavior that is not implemented. It has no shared bearer security scheme.

## Proposed improvement order

These are future tasks, not completed work or delivery commitments.

1. **Protect accounts, payments, and secrets.** Remove credential literals, stop returning password hashes, validate signed payment events and amounts, enforce idempotency, strengthen OTP handling, fix OAuth identity logic, and define token revocation.
2. **Make state changes reliable.** Add transaction boundaries and concurrency safeguards, fix completion notifications, define valid transitions, and resolve date/extension behavior.
3. **Create a dependable test baseline.** Isolate the database, align Prisma imports/versions, mock external services, control time/randomness, and cover security and transition failures.
4. **Stabilize the API contract.** Fix query/URL/import defects, use shared validation and response mapping, complete translations, and align OpenAPI with code.
5. **Improve storage and operations.** Bound uploads, use collision-safe names and durable storage, paginate in the database, add appropriate indexes, coordinate jobs, and configure sessions/proxies/monitoring.
6. **Decide and complete product workflows.** Clarify repeat lending, barter source-item behavior, donation/recycling operations, and repair management before expanding models and endpoints.
7. **Finish repository housekeeping.** Correct package metadata, choose/add the license text, pin tooling, and establish repeatable CI and deployment checks.

## Remaining uncertainties

- A separate admin application or manual process may manage operational states, but none was included in this repository.
- The deployed database, generated client, secret validity, and actual infrastructure were not inspected.
- Midtrans merchant support, provider-specific OAuth responses, SMTP configuration, and payment retries need sandbox verification.
- MySQL query compatibility, migration execution, and a complete passing test run remain unverified.
- Timezone intent, expected date inclusivity, repeated lending, and source barter synchronization need product decisions.

These uncertainties should remain explicit until there is evidence to resolve them.
