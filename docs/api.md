# API Guide

[Documentation index](README.md) · [Business workflows](workflows.md)

## Base paths and authentication

Business endpoints use `/api`. With the example port, the local base URL is `http://localhost:3000/api`; `/api/docs` serves Swagger UI. The application has no API version prefix or health endpoint.

Protected routes require:

```http
Authorization: Bearer <your-token>
```

A Passport session alone is not sufficient for these routes. Manual login and OAuth callbacks return a JWT at the top level of the JSON response. Tokens expire after seven days, and there is no refresh or revocation endpoint.

Messages support `Accept-Language: en` or `Accept-Language: id`; `?lang=id` is also configured. English is the default. Status labels are often English title-case strings even when messages are translated.

## Request formats

Use `application/json` for account/contact changes, borrow applications, request processing, extensions, and payment requests. Use `multipart/form-data` for image uploads; let your HTTP client set the multipart boundary.

| Operation | Main body fields |
| --- | --- |
| Register | `username`, `email`, `password`, `confirmPassword` |
| Login | `identifier` (email or username), `password` |
| Verify email / reset code | `email`, `otp` |
| Request a verification/reset email | `email` |
| Reset password | `email`, `otp`, `newPassword`, `confirmNewPassword` |
| Update profile | Optional `fullname`, `username`, or `password`; a password change also requires `oldPassword` and `confirmPassword` |
| Create address | `addressName`, `address` |
| Create/update phone | `number` |
| Create donation/barter | `item_name`, `description`, `category_id`, `address_id`, `phone_id`, and `images` files |
| Create borrow listing | Common item fields/images plus `duration_from`, `duration_to` |
| Create barter application | Manual item fields/images, or `use_existing_barter_id` to copy an owned listing |
| Create borrow application | `reason`, `address_id`, `phone_id`, `duration_from`, `duration_to`; no image upload |
| Process incoming request | `action`: `accept` or `decline`; `decline_reason` is required for decline |
| Extend borrowing | `duration_to` |
| Create recycle submission | Common item fields/images plus `recycle_location_id` |
| Create repair | Common item fields, `item_weight`, `repair_type`, `repair_location`, and `front_view` / `close_up_damage` files |
| Request payment | `paymentType`; `bankCode` for bank transfers or `ewalletType` for wallets |
| Update profile image | One `profile_picture` file |

Manual passwords have an eight-character minimum. Most item descriptions are limited to 255 characters by Joi despite being database text columns. IDs in body schemas are positive numbers but not consistently restricted to integers. Date schemas require ISO dates and an end after the start where a range is supplied.

Repair types are `minor_repair`, `moderate_repair`, and `major_repair`. Repair locations are `my_location` and `warehouse`. Payment types are `bank_transfer`, `qris`, and `e_wallet`. These accepted fields do not imply that all provider options or workflow paths have been verified.

## Response conventions

Typical successful response:

```json
{
  "success": true,
  "message": "Get current user successful",
  "data": {
    "id": 1,
    "username": "example"
  }
}
```

The object above is shortened to illustrate the envelope, not a complete profile response.

Typical list response:

```json
{
  "success": true,
  "message": "Get list successful",
  "meta": {
    "total": 0,
    "page": 1,
    "size": 10,
    "totalPages": 0
  },
  "data": []
}
```

The list message is illustrative. Actual message text depends on the endpoint and locale.

Typical validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Field email is required"]
  }
}
```

Joi normally rejects unknown body fields and accumulates field errors. Some branches, including existing-item barter applications and payment requests, use manual validation instead.

Exceptions clients need to account for:

- Notification lists return `notifications` and `total`, without ordinary `meta`/`data` fields.
- Barter/borrow history returns separate `my_items` and `other_items` collections under both `data` and `meta`.
- Status may be a raw enum, a title-case string, or an object containing status-history metadata. Query filters expect raw enum values.
- Images may be URL strings or image objects. Donation/recycle creation returns an `image` array; other responses commonly use `images`.
- Successful mutations may return only `success` and `message`. Notification read updates return a count object.
- Unmatched routes return `success: false` and an `errors` string. The geocoding test endpoint returns only `data`.
- Donation detail and barter discovery return HTTP 201. Borrow extension also returns 201 and a creation message.
- Missing bearer headers produce 401, but invalid/expired-token branches currently tend to produce 500 because of error handling defects.

## Filtering and pagination

| List | Supported query fields and details |
| --- | --- |
| Categories | `search`; only active categories are returned |
| Barter discovery | `search`, comma-separated category names in `category`, `maxDistance`, `location`, `sortBy`, `page`, `size` |
| Borrow discovery | Barter discovery fields plus `from`, `to`, `days`; `borrowing_duration` is an additional sort option |
| Donation/recycle history | `search`, category names, comma-separated raw `status` values, `page`, `size` |
| Barter history | `search`, `category`, `userItemStatus`, `otherItemStatus`, `ownership`, `userItemPage`, `userItemSize`, `otherItemPage`, `otherItemSize` |
| Borrow history | Similar, but the controller reads plural `otherItemsStatus`, `otherItemsPage`, and `otherItemsSize` |
| Recycling locations | `search`, category names, `maxDistance`, `location`, `sortBy`, `page`, `size` |
| Repair history | `search`, `status`, numeric category IDs, `repairLocation`, `repairType`, `page`, `size`; some filters are defective |
| News | `search`, `orderBy` (`newest` or `oldest`), `page`, `size` |
| Notifications | `type`, `period`, `page`, `size`; type is `all` or a domain name |

Most lists default to page 1 and size 10, but parsing and invalid-value handling differ. There is no shared maximum size. The `all` value usually disables category/status/ownership filters, with implementation differences across services.

Notification periods are `today`, `yesterday`, `a week ago`, and `a month ago`. The latter two mean trailing date ranges, not a single date. Unknown periods fall back to today. URL-encode values containing spaces.

For barter/borrow history, `my_items` means owned listings and `other_items` means applications submitted by the current user. Incoming requests belong to the owner-detail endpoints. Default discovery sorting called `relevance` has no implemented relevance score.

## Route inventory

The following tables describe all 72 route registrations in the current source. `:name` denotes a path parameter, not a literal value. Controller handler names provide a direct search target in `src/controllers/`.

### Public authentication

Source: [publicApi.js](../src/routes/publicApi.js). No bearer token is required.

| Method | Path | Handler |
| --- | --- | --- |
| `POST` | `/api/register` | `authController.register` |
| `POST` | `/api/verify-email` | `authController.verifyEmail` |
| `POST` | `/api/resend-email-verification-otp` | `authController.resendEmailVerificationOtp` |
| `POST` | `/api/send-reset-password-otp` | `authController.sendResetPasswordOTP` |
| `POST` | `/api/verify-reset-passsword-email` | `authController.verifyResetPasswordOTP` |
| `POST` | `/api/reset-password` | `authController.resetPassword` |
| `POST` | `/api/users/login` | `authController.login` |

### OAuth

Source: [oauthApi.js](../src/routes/oauthApi.js). These routes start or complete Passport authentication and do not require an API bearer token.

| Method | Path | Handler |
| --- | --- | --- |
| `GET` | `/api/auth/google` | `Passport google redirect` |
| `GET` | `/api/auth/google/callback` | `Passport google callback` |
| `GET` | `/api/auth/facebook` | `Passport facebook redirect` |
| `GET` | `/api/auth/facebook/callback` | `Passport facebook callback` |
| `GET` | `/api/auth/twitter` | `Passport twitter redirect` |
| `GET` | `/api/auth/twitter/callback` | `Passport twitter callback` |

### Protected application endpoints

Source: [api.js](../src/routes/api.js). Every row in this table requires a bearer token.

| Method | Path | Handler |
| --- | --- | --- |
| `GET` | `/api/users/current` | `userController.currentUser` |
| `PATCH` | `/api/users/current` | `userController.updateCurrentUser` |
| `PATCH` | `/api/users/current/profile-picture` | `userController.updateProfilePicture` |
| `GET` | `/api/users/current/notifications` | `notificationController.getNotifications` |
| `PATCH` | `/api/users/current/notifications/:notificationId/read` | `notificationController.readNotification` |
| `PATCH` | `/api/users/current/notifications/read-all` | `notificationController.readAllNotifications` |
| `GET` | `/api/categories` | `categoryController.getCategories` |
| `GET` | `/api/news` | `newsController.listNews` |
| `GET` | `/api/news/:newsId` | `newsController.detailNews` |
| `GET` | `/api/users/current/addresses` | `addressController.getAddresses` |
| `POST` | `/api/users/current/addresses` | `addressController.createAddress` |
| `GET` | `/api/users/current/addresses/:addressId` | `addressController.getAddressById` |
| `PATCH` | `/api/users/current/addresses/:addressId` | `addressController.updateAddress` |
| `DELETE` | `/api/users/current/addresses/:addressId` | `addressController.deleteAddress` |
| `GET` | `/api/users/current/phones` | `phoneController.getPhones` |
| `POST` | `/api/users/current/phones` | `phoneController.createPhone` |
| `GET` | `/api/users/current/phones/:phoneId` | `phoneController.getPhoneById` |
| `PATCH` | `/api/users/current/phones/:phoneId` | `phoneController.updatePhone` |
| `DELETE` | `/api/users/current/phones/:phoneId` | `phoneController.deletePhone` |
| `GET` | `/api/users/current/donations` | `donationController.getDonations` |
| `GET` | `/api/users/current/donations/:donationId` | `donationController.getDonationDetail` |
| `POST` | `/api/donations` | `donationController.createDonation` |
| `GET` | `/api/barters` | `barterController.getBarters` |
| `POST` | `/api/barters` | `barterController.createBarter` |
| `GET` | `/api/barters/:barterId` | `barterController.getBarterDetail` |
| `POST` | `/api/barters/:barterId/request` | `barterApplicationController.createBarterApplication` |
| `GET` | `/api/users/current/barters` | `barterController.getBarterHistory` |
| `GET` | `/api/users/current/barters/:barterId` | `barterController.getMyBarterDetail` |
| `GET` | `/api/users/current/barter-requests/:requestId` | `barterApplicationController.getMyRequestDetail` |
| `POST` | `/api/users/current/barters/:barterId/mark-as-completed` | `barterController.markBarterAsCompleted` |
| `GET` | `/api/users/current/barters/:barterId/requests/:requestId` | `barterController.getMyBarterIncomingRequestDetail` |
| `POST` | `/api/users/current/barters/:barterId/requests/:requestId/process` | `barterController.processIncomingRequest` |
| `GET` | `/api/borrows` | `borrowController.getBorrows` |
| `POST` | `/api/borrows` | `borrowController.createBorrow` |
| `GET` | `/api/borrows/:borrowId` | `borrowController.getBorrowDetail` |
| `POST` | `/api/borrows/:borrowId/request` | `borrowApplicationController.createBorrowApplication` |
| `GET` | `/api/users/current/borrows` | `borrowHistoryController.getBorrowHistory` |
| `GET` | `/api/users/current/borrows/:borrowId` | `borrowController.getMyBorrowDetail` |
| `GET` | `/api/users/current/borrow-requests/:requestId` | `borrowHistoryController.getMyBorrowRequestDetail` |
| `POST` | `/api/users/current/borrows/:borrowId/mark-as-lent` | `borrowController.markBorrowAsLent` |
| `POST` | `/api/users/current/borrows/:borrowId/mark-as-returned` | `borrowController.markBorrowAsReturned` |
| `POST` | `/api/users/current/borrows/:borrowId/mark-as-completed` | `borrowController.markBorrowAsCompleted` |
| `GET` | `/api/users/current/borrows/:borrowId/requests/:requestId` | `borrowController.getMyBorrowIncomingRequestDetail` |
| `POST` | `/api/users/current/borrows/:borrowId/requests/:requestId/extend` | `borrowApplicationController.extendBorrowApplication` |
| `POST` | `/api/users/current/borrows/:borrowId/requests/:requestId/process` | `borrowController.processIncomingRequest` |
| `POST` | `/api/recycles` | `recycleController.createRecycle` |
| `GET` | `/api/recycle-locations` | `recycleController.getRecycleLocations` |
| `GET` | `/api/recycle-locations/:recycleLocationId` | `recycleController.getRecycleLocationDetail` |
| `GET` | `/api/users/current/recycles` | `recycleHistoryController.getMyRecycleHistory` |
| `GET` | `/api/users/current/recycles/:recycleId` | `recycleHistoryController.getMyRecycleDetail` |
| `GET` | `/api/categories/:categoryId/repair-prices` | `repairController.getRepairPrice` |
| `POST` | `/api/repairs` | `repairController.createRepair` |
| `GET` | `/api/repairs/:repairId` | `repairController.getRepairDetail` |
| `POST` | `/api/repairs/:repairId/pay` | `repairController.requestRepairPayment` |
| `GET` | `/api/repairs/:repairId/payment-status` | `repairController.getRepairPaymentStatus` |
| `GET` | `/api/users/current/repairs` | `repairHistoryController.getMyRepairHistory` |
| `GET` | `/api/users/current/repairs/:repairId` | `repairHistoryController.getMyRepairDetail` |

### Public integration and development endpoints

These two routes in `api.js` have no bearer authentication. The webhook signature check is currently disabled, and the geocoding route remains exposed. Neither should be treated as a secured public integration.

| Method | Path | Handler |
| --- | --- | --- |
| `POST` | `/api/payment/notification` | `paymentNotificationController.midtransNotification` |
| `GET` | `/api/test/:query` | `Inline geocoding handler` |

## Example requests

These examples describe local usage after configuration and database preparation. They were not executed during the documentation review. Use only test accounts and a disposable database.

Register a user, then enter the emailed OTP through the verification endpoint:

```bash
curl --request POST http://localhost:3000/api/register \
  --header 'Content-Type: application/json' \
  --data '{"username":"example","email":"example@example.com","password":"local-example-password","confirmPassword":"local-example-password"}'
```

The example email is a placeholder. Registration sends real SMTP mail when configured; use an address you control for a local test.

After verification, request a token:

```bash
curl --request POST http://localhost:3000/api/users/login \
  --header 'Content-Type: application/json' \
  --data '{"identifier":"example","password":"local-example-password"}'
```

Use the returned token to read the profile:

```bash
curl http://localhost:3000/api/users/current \
  --header 'Authorization: Bearer <your-token>' \
  --header 'Accept-Language: en'
```

Before submitting an item, create owned address/phone records and choose an existing category. Do not assume that seed IDs belong to your account.

## OpenAPI differences

The [existing specification](openapi.yaml) parses as YAML and declares OpenAPI 3.1.0. It documents 70 operations. It is served by Swagger UI but is not enforced as request validation, and parsing alone is not OpenAPI contract validation.

| Area | Specification vs. code |
| --- | --- |
| Reset-code verification | Spec: `/api/verify-reset-password-email`; route: `/api/verify-reset-passsword-email` with three consecutive `s` characters in `passsword` |
| Recycling-location detail | Spec path uses `{recyleLocationId}`, while its parameter declaration and route use `recycleLocationId` |
| Borrow-history queries | Spec uses singular `otherItemStatus/Page/Size`; controller reads plural `otherItemsStatus/Page/Size` |
| Repair category filtering | Spec describes names; service converts values into numeric IDs |
| Repair payment retries | Spec promises pending-instruction reuse and a new order after terminal failure; implementation does neither reliably |
| Missing operations | Payment notification and geocoding test route are not documented in OpenAPI |
| Incomplete operation | `GET /api/repairs/{repairId}` has no response specification |
| HTTP status differences | Donation detail and barter discovery use 201 in code; repair-price lookup uses 200 rather than the documented 202 |
| Required fields | Some documented request schemas omit fields required by Joi, such as `addressName` on address creation |
| Path parameters | Some mark-as-* operations declare a `requestId` parameter absent from the actual path |
| Authentication description | Many endpoints describe Authorization as a header parameter; no shared bearer security scheme exists |
| History terminology | Some barter descriptions call outgoing applications incoming requests |

These differences are recorded here without changing the existing specification. The route inventory is based on the source, not inferred from OpenAPI examples. See [Known limitations](known-limitations.md) for defects that affect otherwise documented routes.
