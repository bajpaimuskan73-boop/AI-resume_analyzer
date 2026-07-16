const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const firestore = admin.firestore();
const storage = admin.storage();

// Helper: delete documents in batches where field uid == targetUid
async function deleteCollectionByUid(collectionPath, targetUid) {
  const collectionRef = firestore.collection(collectionPath);
  const query = collectionRef.where('uid', '==', targetUid).limit(500);

  async function deleteBatch() {
    const snapshot = await query.get();
    if (snapshot.empty) return;
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    // Recursive - continue until no documents remain
    await deleteBatch();
  }

  await deleteBatch();
}

exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Only authenticated callers
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request must be authenticated');
  }

  const callerUid = context.auth.uid;
  const targetUid = data?.uid || callerUid;

  // Allow callers to delete only their own account unless they have admin claim
  if (targetUid !== callerUid && !(context.auth.token && context.auth.token.admin)) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized to delete this account');
  }

  try {
    // Delete Firestore data - update this list for all collections you use
    await deleteCollectionByUid('resume_analysis', targetUid);

    // Delete storage objects under folder with uid as prefix (if you store files like `${uid}/...`)
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: `${targetUid}/` });
    if (files && files.length) {
      await Promise.all(files.map(f => f.delete()));
    }

    // Delete Authentication user
    await admin.auth().deleteUser(targetUid);

    return { success: true };
  } catch (err) {
    console.error('Error in deleteUserAccount:', err);
    throw new functions.https.HttpsError('internal', 'User deletion failed: ' + err.message);
  }
});
