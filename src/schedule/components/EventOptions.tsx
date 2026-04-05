import { FabAddNewEvent } from './FabAddNewEvent';
import { FabDeleteEvent } from './FabDeleteEvent';

export const EventOptions = () => {
  return (
    <section className="event-options">
      <FabAddNewEvent />
      <FabDeleteEvent />
    </section>
  );
};
