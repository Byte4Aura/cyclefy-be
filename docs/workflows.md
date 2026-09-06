# Business Workflows

[Documentation index](README.md) · [Database model](database.md)

This guide follows requests across files. Status names are shown as their database enum values; API responses sometimes convert them to title case. A flow described here can still fail because of the issues linked in each section.

## Registration, verification, and login

Path through the code: [public routes](../src/routes/publicApi.js) → [auth controller](../src/controllers/authController.js) → [auth service](../src/services/authService.js) → [auth helpers](../src/helpers/authHelper.js), mailer, and Prisma.

1. `POST /api/register` validates username, email, password, and confirmation.
2. A verified email or conflicting username is rejected. The same unverified email/username causes a new OTP to be sent without replacing the original password.
3. A new password is hashed with bcrypt at cost 10 and the user is saved as active but unverified.
4. The service downloads a UI Avatars image to local disk and stores its public path.
5. A four-digit OTP is stored with a 15-minute expiry and emailed to the user.
6. `POST /api/verify-email` finds an unused, unexpired matching OTP, verifies the user, and marks that record used.
7. `POST /api/users/login` accepts username or email, compares the password, checks activation and verification, and returns a seven-day JWT.

Avatar or mail failures happen after user creation; there is no rollback. The avatar helper's catch branch references an unimported logger. Registration can therefore fail after the account already exists.

Password recovery creates another 15-minute code. The actual reset checks expiry and usage, updates the bcrypt hash, then consumes the OTP. The separate reset-code verification endpoint checks only email/code existence and can report an expired or used code as valid. Resetting a password does not revoke existing JWTs.

## OAuth and authorization

[OAuth routes](../src/routes/oauthApi.js) start Passport authentication and return a JWT after callbacks. [Passport strategies](../src/application/passport.js) look up accounts by email, create users if needed, and save provider data in some branches. Twitter can use a synthetic `@twitter.local` email when no email is returned.

Sessions support Passport, but protected domain routes still require a bearer token. [authMiddleware](../src/middlewares/authMiddleware.js) verifies that token and places the payload in `req.user`. It does not reload the user or check current activation status.

Authorization is ownership-based. Services scope personal queries to the current user and check that incoming applications belong to an owned listing. There is no role-based authorization. OAuth provider handling has several defects, detailed in [Known limitations](known-limitations.md#authentication-and-authorization).

## Profile, addresses, and phones

Profile updates can change fullname, username, or password. Password changes require the old password and confirmation. Profile-picture upload stores a new local file, updates the user, and attempts to delete the old local profile image. The current response helper returns a null image URL, and password updates expose the new hash in the response.

Address creation passes text through OpenStreetMap geocoding and stores the formatted address, coordinates, and location details. Address/phone operations verify ownership. Address updates always geocode, including requests that only change the label.

Phone creation checks duplicates for the same user. Phone updates do not repeat this check, and there is no corresponding database uniqueness constraint. Deleting a referenced address or phone is rejected by the foreign key, even for completed activities.

## Shared item submission

The main [domain router](../src/routes/api.js) applies JWT authentication before Multer. Donation, barter, borrow, and recycle creation then follow this sequence:

1. Save multipart images to disk.
2. Pass body, images, current user ID, and request context to the service.
3. Require images and validate the body with Joi.
4. Use [ownership helpers](../src/helpers/userHelper.js) to check address/phone ownership and category existence.
5. Save the item, image rows, initial history, and notification in separate operations.
6. Map the saved data to an HTTP response.

Category creation checks do not reject inactive categories. Most upload controllers attempt file cleanup after a service failure, but saved database rows remain. Repair creation uses a different two-group upload shape and does not implement equivalent error cleanup.

## Discovery and distance

Barter and borrow discovery require at least one saved address, exclude owned listings, and include only listings whose latest status is `waiting_for_request` or `waiting_for_confirmation`.

Distance is the minimum straight-line distance in kilometres from any of the user's addresses to the listing or recycling location. It is calculated locally with Geolib. No preferred address, live device location, or driving route is used.

The services load candidate records, compute distances, filter latest statuses, sort, and paginate in memory. `nearest` sorts by distance; barter/borrow also support `newest`. Default `relevance` has no ranking algorithm. Location text is ignored when a truthy maximum distance is supplied. In barter/borrow search, location is added to the text-search `OR` conditions rather than a separate required condition.

Borrow discovery adds `duration_from >= now`, so a listing whose availability has already begun disappears from discovery even if its end date is still in the future. Direct detail endpoints do not enforce the same discovery availability filter.

## Donation

Code: [donationController.js](../src/controllers/donationController.js) → [donationService.js](../src/services/donationService.js).

Submission creates a `Donation`, images, a `submitted` history, and an owner notification. Personal history supports search, category names, latest-status filters, and pagination. Detail returns the item, address, images, and full status timeline.

The enum also supports `confirmed`, `completed`, and `failed`. Seeders can populate these states, but no routes implement operational progression or recipient assignment. There is no donation-recipient/application model.

## Barter

Code: [barterService.js](../src/services/barterService.js) and [barterApplicationService.js](../src/services/barterApplicationService.js).

| Action | Listing status | Selected application status |
| --- | --- | --- |
| Publish | `waiting_for_request` | — |
| Submit first offer | `waiting_for_confirmation` | `request_submitted` |
| Accept | `confirmed` | `confirmed` |
| Complete | `completed` | `completed` |
| Decline an offer | Unchanged | `failed` |

An applicant cannot request their own listing. The target listing must be waiting for a request or confirmation. An offer can be entered manually with images or copied from an existing owned barter listing using `use_existing_barter_id`.

For an existing item, the service copies fields and image paths, then removes any newly uploaded images. Duplicate prevention uses target listing, applicant, and item name. Availability checking for the source item is commented out, and no source-listing link is saved.

The owner can process an offer only while the listing is `waiting_for_confirmation` and the application is `request_submitted`. Acceptance confirms both, clears the selected decline reason, and fails competing applications. Decline requires a reason and leaves the listing state unchanged.

Completion requires a confirmed listing and application. It appends two completed histories, then attempts a notification. That notification omits required message data, so the request can report failure after completing the histories. The original source listing of a copied offer is not updated.

Personal history returns `my_items` (owned listings) and `other_items` (the user's outgoing applications), each with separate pagination. Incoming offers appear inside owned listing details. This distinction differs from some old comments and OpenAPI descriptions.

## Borrowing

Code: [borrowService.js](../src/services/borrowService.js), [borrowApplicationService.js](../src/services/borrowApplicationService.js), [borrowHistoryService.js](../src/services/borrowHistoryService.js), and [borrowHelper.js](../src/helpers/borrowHelper.js).

| Action | Listing status | Selected application status | Actor |
| --- | --- | --- | --- |
| Publish availability | `waiting_for_request` | — | Owner |
| Submit first request | `waiting_for_confirmation` | `request_submitted` | Applicant |
| Accept | `confirmed` | `confirmed` | Owner |
| Hand over | `lent` | `borrowed` | Owner |
| Return | `returned` | `returned` | Owner |
| Finish | `completed` | `completed` | Owner |
| Extend | `extended` | `extended` | Owner |
| Deadline passes | `overdue` | `overdue` | Hourly job |

The owner sets availability dates on `Borrow`. An applicant supplies a reason, owned address/phone, and a requested window within that availability. End dates must be after start dates under Joi validation.

The service converts the application's end date to the end of the day using server-local time. Listing creation calculates an end-of-day value but saves the original input instead. This can reject a request that ends on the listing's final calendar day.

Request creation rejects self-requests, but does not reject unavailable listing states. Duplicate/overlap prevention is commented out. Acceptance requires waiting-for-confirmation/request-submitted states and cancels competing applications. Declining one request sets it to `cancelled` without resetting the listing.

An extension is allowed only from listing `lent`/`overdue` and application `borrowed`/`overdue`. The new deadline must be later than the previous one and within the listing window. Both records receive `extended` histories.

**Current gap:** the return endpoint and another immediate extension do not accept `extended`. The hourly job can later change it to `overdue`, which the return endpoint accepts. This is an implementation defect, not a recommended business rule.

The hourly job checks applications with passed deadlines and historical borrowed/extended rows, then verifies their latest status before updating. Parent listings are updated only from lent/extended states. No notification or distributed lock is implemented. Completion has the same missing notification message-data issue as barter.

## Recycling

Code: [recycleService.js](../src/services/recycleService.js) and [recycleHistoryService.js](../src/services/recycleHistoryService.js).

Location discovery requires user addresses and supports category, name, location, and distance filters. Detail includes contact information, description, categories, and images.

Creating a recycle submission follows the common item flow, also checks that `recycle_location_id` exists, and creates a `submitted` history. It does not validate category membership for that location. Personal history/detail are owner-scoped.

The `confirmed`, `completed`, and `failed` states are defined and used by seed data. Operational endpoints to create those transitions are absent.

## Repair and payment

Code: [repairService.js](../src/services/repairService.js) → Midtrans charge API; [paymentNotificationController.js](../src/controllers/paymentNotificationController.js) receives callbacks.

1. Validate item details, positive weight, repair type/location, and owned contact records.
2. Require at least one `front_view` and one `close_up_damage` image. Multer allows up to five files in each group.
3. Read the category's `RepairPrice` and choose the price for the selected repair type.
4. Calculate `amount = pricePerKg × item_weight` and `admin_fee = ceil(amount × 0.05)`.
5. Save the repair, images, `request_submitted` history, pending payment, and notification.
6. When the owner calls `/repairs/:repairId/pay`, send an Axios charge request to Midtrans with the stored order ID and total.
7. Store the returned bank-transfer, QRIS, or e-wallet instructions. The charge payload requests a 25-minute expiry.

For example, a configured price of 10,000 and a weight of 2 produces an amount of 20,000, an admin fee of 1,000, and a total of 21,000. Fractional weights have no explicit rounding rule for the integer payment amount field.

Creation only stores a pending local payment; it does not call the gateway. Payment requests accept `bank_transfer`, `qris`, or `e_wallet`. The code's bank allowlist is `bca`, `bni`, `bri`, `bsi`, and `cimb`, but it is checked after the external charge request. E-wallet type is passed through without a complete local allowlist. Merchant support was not verified.

The webhook currently maps gateway statuses as follows:

| Gateway status | Stored payment status |
| --- | --- |
| `settlement`, `capture` | `paid` |
| `pending` | `pending` |
| `expire` | `expired` |
| `cancel`, `deny` | `failed` |
| `refund`, `chargeback` | `cancelled` |
| Other values | `pending` |

A paid notification appends a `confirmed` repair history. Signature verification is disabled, fraud status is ignored, and duplicate or out-of-order callbacks are not controlled. **Do not use this handler for real payments in its current state.**

Payment-status reads return local database values. There is no gateway reconciliation job. Retrying a pending payment calls the gateway again; non-pending payments are rejected. The new-order retry behavior promised in the OpenAPI description is not implemented.

Repair histories can display `under_repair`, `completed`, and `failed`, but only seeders populate the later operational states in this repository. No technician or warehouse management endpoints exist.

## Notifications and news

[notificationService.js](../src/services/notificationService.js) creates in-app rows during submissions, incoming applications, and attempted barter/borrow completions. Most notifications go to the listing owner. Acceptance, decline, and overdue changes do not create notifications.

Notification reads translate `message_key` with JSON message data at request time. Titles are stored English text, and redirects point to backend API URLs. Filtering supports today, yesterday, the last week, and the last month using server-local date boundaries. Read updates are owner-scoped. Delivery is polling-based; no socket or push service exists.

[newsService.js](../src/services/newsService.js) lists articles with a 200-character content preview and returns full content in detail. List pagination uses database skip/take. There are no authoring routes, and the current image-helper and missing-error-import defects affect responses.
