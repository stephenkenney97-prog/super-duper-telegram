import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

export const getPlantsPath = (appId, userId) => `/artifacts/${appId}/users/${userId}/plants`;

export const getHealthLogsPath = (appId, userId, plantId) =>
  `${getPlantsPath(appId, userId)}/${plantId}/healthLogs`;

// Firestore does not cascade-delete subcollections, so health logs must be
// removed explicitly. writeBatch caps at 500 operations; a plant with more
// than 499 health logs would not fully cascade-delete here.
export const deletePlantWithHealthLogs = async ({ firestore, appId, userId, plantId }) => {
  const healthLogsRef = collection(firestore, getHealthLogsPath(appId, userId, plantId));
  const healthLogsSnapshot = await getDocs(healthLogsRef);

  const batch = writeBatch(firestore);
  healthLogsSnapshot.docs.forEach((logDoc) => batch.delete(logDoc.ref));
  batch.delete(doc(firestore, getPlantsPath(appId, userId), plantId));

  await batch.commit();
};
