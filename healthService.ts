import { store } from './index2.js';

// We dynamic import to avoid crashes if not on Android/plugin not ready
async function getHealthConnect() {
  try {
    const { HealthConnect } = await import('capacitor-health-connect');
    return HealthConnect;
  } catch (e) {
    console.warn('Health Connect plugin not found');
    return null;
  }
}

export async function syncMorningEnergy() {
  const HealthConnect = await getHealthConnect();
  if (!HealthConnect) return;

  try {
    const { availability } = await HealthConnect.checkAvailability();
    if (availability !== 'Available') {
      console.warn('Health Connect not available on this device');
      return;
    }

    // Request permissions for steps and sleep (sleep might need casting if not in type def)
    await HealthConnect.requestHealthPermissions({
      read: ['Steps', 'RestingHeartRate'] as any, // Trying to get what we can
      write: [],
    });

    // Look back at the last 24 hours
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

    // Fallback: If SleepSession isn't in types, we try to fetch it as any
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

  // Calculate steps
  const totalSteps = stepsRecords.reduce((total, r: any) => total + (r.count || 0), 0);

  /*
     Morning Energy Score Algorithm (0-100)
     Base: 40%
     Sleep: +10% per hour over 4 hours (max +50% at 9 hours)
     Steps: -2% for every 2k steps over 10k (fatigue penalty)
  */
  const sleepBonus = sleepMinutes > 0
    ? Math.min(50, Math.max(0, (sleepMinutes / 60 - 4) * 10))
    : 20; // Default bonus if sleep not tracked but steps are

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
