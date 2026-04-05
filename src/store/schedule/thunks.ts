import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';

import { FirebaseDB } from '../../firebase/config';
import type { ReduxScheduleEvent } from './types/calendar-state';
import type { AppDispach, RootState } from '../store';
import { loadSchedule } from '../../helpers/load-schedule';
import { updateEvent, addNewEvent, deleteEvent, loadEvents } from './schedule-slice';

export const startSavingEvent = (event: ReduxScheduleEvent) => {
  return async (dispatch: AppDispach) => {
    const { userId } = event;

    if (event.id) {
      const { id, ...eventToFirebase } = event;
      const docRef = doc(FirebaseDB, `${userId}/gallery/schedule/${id}`);
      await setDoc(docRef, eventToFirebase, { merge: true });
      dispatch(updateEvent({ ...event, userId: userId! }));
      return;
    }

    const newDoc = doc(collection(FirebaseDB, `${userId}/gallery/schedule`));
    event.id = newDoc.id;
    await setDoc(newDoc, event);
    dispatch(addNewEvent(event));
  };
};

export const startDeletingEvent = () => {
  return async (dispatch: AppDispach, getState: () => RootState) => {
    const { uid } = getState().auth;
    const { activeEvent: event } = getState().schedule;

    const docRef = doc(FirebaseDB, `${uid}/gallery/schedule/${event!.id}`);
    await deleteDoc(docRef);
    dispatch(deleteEvent());
  };
};

export const startLoadingEvents = (projectId: string) => {
  return async (dispatch: AppDispach, getState: () => RootState) => {
    const { uid } = getState().auth;
    if (!uid) return;

    const schedule = await loadSchedule(uid, projectId);
    dispatch(loadEvents(schedule));
  };
};
