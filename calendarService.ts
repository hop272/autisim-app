import { store, CalendarEvent } from './index2.js';

// Accessing via global Capacitor since we don't have a web bundler to resolve imports at runtime
function getCalendarPlugin() {
  const win = window as any;
  if (win.Capacitor && win.Capacitor.Plugins && win.Capacitor.Plugins.CapacitorCalendar) {
    return win.Capacitor.Plugins.CapacitorCalendar;
  }
  return null;
}

export async function syncPhoneCalendar() {
  const Calendar = getCalendarPlugin();
  if (!Calendar) {
    console.error('Calendar plugin not available. Please ensure the app is running on a device.');
    return false;
  }

  try {
    // 1. Check and request permissions
    const status = await Calendar.checkPermission({ alias: 'readCalendar' });
    if (status.result !== 'granted') {
      const request = await Calendar.requestPermission({ alias: 'readCalendar' });
      if (request.result !== 'granted') {
        console.warn('Calendar permissions denied');
        return false;
      }
    }

    // 2. Fetch events for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();

    const { result } = await Calendar.listEventsInRange({
      startDate: startOfDay,
      endDate: endOfDay,
    });

    // 3. Map to our app's CalendarEvent format
    const mappedEvents: CalendarEvent[] = (result || []).map((event: any) => {
      const title = (event.title || '').toLowerCase();

      let noise = 3;
      let light = 3;
      let crowding = 2;
      let icon = '📅';

      if (title.includes('shop') || title.includes('store') || title.includes('market') || title.includes('grocery')) {
        noise = 7; light = 6; crowding = 8; icon = '🛒';
      } else if (title.includes('party') || title.includes('club') || title.includes('concert') || title.includes('pub')) {
        noise = 10; light = 9; crowding = 10; icon = '🎉';
      } else if (title.includes('doctor') || title.includes('hospital') || title.includes('dentist') || title.includes('appointment')) {
        noise = 5; light = 8; crowding = 6; icon = '🏥';
      } else if (title.includes('meeting') || title.includes('office') || title.includes('work') || title.includes('zoom')) {
        noise = 4; light = 5; crowding = 4; icon = '💼';
      } else if (title.includes('quiet') || title.includes('meditation') || title.includes('yoga') || title.includes('nap')) {
        noise = 1; light = 2; crowding = 1; icon = '🧘';
      }

      return {
        id: `phone-${event.id}`,
        externalId: event.id,
        title: event.title || 'Untitled Event',
        startTime: Number(event.startDate),
        endTime: Number(event.endDate),
        location: event.location,
        description: event.description,
        isSynced: true,
        icon: icon,
        sensoryProfile: { noise, light, crowding },
        energyCost: -(noise + light + crowding) / 2
      };
    });

    const state = store.getState();
    const localEvents = state.calendarEvents.filter(ev => !ev.isSynced);

    store.setCalendarEvents([...localEvents, ...mappedEvents]);

    return true;
  } catch (error) {
    console.error('Failed to sync calendar:', error);
    return false;
  }
}
