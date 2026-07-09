import { store } from './index2.js';

// Accessing via global Capacitor since we don't have a web bundler to resolve imports at runtime
function getHealthConnect() {
  const win = window as any;
  if (win.Capacitor && win.Capacitor.Plugins && win.Capacitor.Plugins.HealthConnect) {
    return win.Capacitor.Plugins.HealthConnect;
  }
  return null;
}

export async function syncMorningEnergy() {
  const HealthConnect = getHealthConnect();
  if (!HealthConnect) return;

  try {
    const { availability } = await HealthConnect.checkAvailability();
    if (availability !== 'Available') {
      console.warn('Health Connect not available on this device');
      return;
    }

    // Request permissions for steps and sleep
    await HealthConnect.requestHealthPermissions({
      read: ['Steps', 'RestingHeartRate'] as any,
      write: [],
    });

    const endTime = new Date();
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 24);

    const stepsResult = await HealthConnect.readRecords({
      type: 'Steps',
      timeRangeFilter: {
        type: 'between',
        startTime: startTime,
        endTime: endTime
      },
    });

    let sleepMinutes = 0;
    try {
        const sleepResult = await HealthConnect.readRecords({
          type: 'SleepSession' as any,
          timeRangeFilter: {
            type: 'between',
            startTime: startTime,
            endTime: endTime
          },
        });

        sleepMinutes = (sleepResult.records as any[]).reduce((total, r) => {
            return total + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
        }, 0);
    } catch (e) {
        console.warn('Sleep data fetch failed, using steps only');
    }

    applyEnergyFormula(sleepMinutes, stepsResult.records);
  } catch (error) {
    console.error('Health Sync Error:', error);
  }
}

function applyEnergyFormula(sleepMinutes: number, stepsRecords: any[]) {
  const state = store.getState();
  const totalSteps = stepsRecords.reduce((total, r: any) => total + (r.count || 0), 0);

  const sleepBonus = sleepMinutes > 0
    ? Math.min(50, Math.max(0, (sleepMinutes / 60 - 4) * 10))
    : 20;

  const stepPenalty = totalSteps > 10000 ? Math.floor((totalSteps - 10000) / 2000) * -2 : 0;
  const finalScore = Math.min(100, Math.max(0, 40 + sleepBonus + stepPenalty));
  const diff = Math.round(finalScore - state.currentEnergy);

  if (Math.abs(diff) > 2) {
    store.addEnergyEntry({
      timestamp: Date.now(),
      activity: `Health Sync (${sleepMinutes > 0 ? Math.round(sleepMinutes/60) + 'h sleep' : 'Steps log'})`,
      activityType: 'rest',
      cost: diff,
      note: `Calculated from Health Connect: ${totalSteps} steps logged in last 24h.`
    });
    store.setCurrentEnergy(finalScore);
  }
}
