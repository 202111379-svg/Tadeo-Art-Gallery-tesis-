import { collection, getDocs, query, where } from 'firebase/firestore';

import { FirebaseDB } from '../firebase/config';
import type { ReduxScheduleEvent } from '../store/schedule/types/calendar-state';

export const loadSchedule = async (
  uid: string,
  projectId: string
): Promise<ReduxScheduleEvent[]> => {
  const collectionRef = query(
    collection(FirebaseDB, `${uid}/gallery/schedule`),
    where('projectId', '==', projectId)
  );
  const docs = await getDocs(collectionRef);

  const events: ReduxScheduleEvent[] = [];

  docs.forEach((doc) => {
    const eventDoc = doc.data() as ReduxScheduleEvent;
    events.push({ ...eventDoc, id: eventDoc.id });
  });

  return events;
};
