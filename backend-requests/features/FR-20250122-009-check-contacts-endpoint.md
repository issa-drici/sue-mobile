# Backend Request: Check Contacts Registration

**Feature:** Find Friends from Contacts
**Priority:** High

## Description
We need an endpoint to verify which phone numbers from a user's address book are already registered on SUE.

## Endpoint Request

`POST /api/users/check-contacts`

### Request Body
```json
{
  "phoneNumbers": [
    "+33612345678",
    "0687654321",
    "+15550009999"
  ]
}
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "phoneNumber": "+33612345678",
      "isRegistered": true,
      "user": {
        "id": "uuid-123",
        "firstname": "John",
        "lastname": "Doe",
        "avatar": "https://...",
        "relationship": {
            "isFriend": false,
            "hasPendingRequest": false
        }
      }
    },
    {
      "phoneNumber": "0687654321",
      "isRegistered": false
    }
  ]
}
```

## Logic
1.  Normalize phone numbers (match ignoring spacing/formatting if possible).
2.  Check against `users` table.
3.  Return unregistered numbers as well (or at least imply them) so we can show "Invite" buttons.
