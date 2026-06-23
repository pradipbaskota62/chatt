# Security Specification for Firebase Chat App

This document details the Zero-Trust security posture for our Cloud Firestore collections (`users`, `channels`, and `messages`).

## Part 1: Data Invariants

1. **User Invariants**:
   - A user profile must have a document ID matching the user's authenticating `uid`.
   - The user profile cannot be created or updated by another user.
   - Profile `lastSeen` values must correspond strictly to `request.time`.

2. **Channel Invariants**:
   - Channels can be established as public rooms or direct messages (DMs).
   - Channels must have unique IDs following the standard regex format.
   - Creation requires a valid author match (`createdBy == request.auth.uid`).

3. **Message Invariants**:
   - Every message MUST reside under a parent channel path `/channels/{channelId}/messages/{messageId}`.
   - The `senderId` property must strictly match `request.auth.uid`. No identity spoofing is allowed.
   - `content` must be a valid string between 1 and 2000 characters.
   - `createdAt` must strictly match `request.time`. Retroactive or future timestamps are forbidden.

---

## Part 2: The "Dirty Dozen" Payloads

Here are 12 specific payloads or actions designed to breach the system bounds, all of which will be blocked with `PERMISSION_DENIED`.

### Pillar 1: User Identity Bypasses
1. **User Profile Hijacking**: Attempt to create `/users/attacker_uid` containing `{ "uid": "victim_uid", "displayName": "Victim" }`.
2. **User Email Spoofing**: Attempt to register `/users/target_user` containing `{ "email": "admin@chat.com", "email_verified": false }`.
3. **Presence Tampering**: Attempt to set a custom historical timestamp `{ "lastSeen": "1999-12-31T23:59:59Z" }` instead of using the server dynamic key.

### Pillar 2: Channel Resource Poisoning
4. **Channel ID Poisoning**: Attempt to create a channel with ID `channels/channel_name_longer_than_128_chars_xxxxxxxxx...` to cause system memory leaks.
5. **Anonymous Channel Spawn**: Attempt to create a channel document without an authenticated session (`request.auth == null`).
6. **Privilege Escalation**: Attempt to set an unverified custom administrative flag `{ "role": "admin" }` on self profile document.

### Pillar 3: Message Spoofing & Tampering
7. **Message Identity Spoof**: Attempt to write a message to `/channels/general/messages/msg_1` set as `{ "senderId": "victim_uid", "senderName": "Victim", "content": "I hereby yield" }`.
8. **Temporal Drift**: Attempt to forge message sender history with `{ "createdAt": "2020-01-01T00:00:00Z" }` to manipulate history order.
9. **Message Payload Poisoning**: Attempt to save `{ "content": ["this is an array", "not a string"] }` where a pure string was mandated.
10. **Unauthorized Chat Alteration**: Authenticated User B attempts to rewrite User A's previously broadcasted message content.
11. **Unauthorized Chat Eviction**: Authenticated User B attempts to delete User A's message from a channel.
12. **Blanket Query Abuse**: Client attempts to submit a query for the entire `users` list without checking any single UID match, to harvest all emails.

---

## Part 3: Test Runner Blueprint (firestore.rules.test.ts)

A code setup to run firestore rules validations locally:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "chat-app-b0f58",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Denies user identity spoofing", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  const spoofRef = doc(aliceDb, "users", "alice");
  await expect(
    setDoc(spoofRef, {
      uid: "bob", // Spoofing!
      displayName: "Alice",
      email: "alice@example.com",
      status: "online",
      lastSeen: new Date(),
    })
  ).rejects.toThrow();
});
```
