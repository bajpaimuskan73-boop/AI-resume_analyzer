Delete User Cloud Function

This Cloud Function (`deleteUserAccount`) securely deletes a Firebase Authentication user and associated Firestore and Storage data.

Deploy steps:

1. Install Firebase CLI (if not installed):

```bash
npm install -g firebase-tools
```

2. Login and select your project:

```bash
firebase login
firebase use --add
```

3. From this `functions` folder, install deps and deploy:

```bash
cd functions
npm install
firebase deploy --only functions:deleteUserAccount
```

4. Client usage (callable function) example (from frontend):

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const deleteFn = httpsCallable(functions, 'deleteUserAccount');

// Call (user must be authenticated):
const res = await deleteFn({ uid: firebaseAuth.currentUser.uid });
```

Security notes:
- The function allows callers to delete only their own account unless the caller has an `admin` custom claim.
- For full account deletion you should ensure all collections that store user data are included in the deletion logic.
- The Admin SDK (used by Cloud Functions) bypasses client re-auth requirements and is the recommended approach for production/GDPR deletion flows.
