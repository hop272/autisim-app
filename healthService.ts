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

    // Request permissions for steps, heart rate and sleep
    if (typeof HealthConnect.requestHealthPermissions !== 'function') {
      console.warn('requestHealthPermissions not found on HealthConnect plugin');
      return;
    }

    try {
        await HealthConnect.requestHealthPermissions({
          read: ['Steps', 'RestingHeartRate', 'HeartRate'] as any,
          write: [],
        });
    } catch (e) {
        console.warn('Failed to request health permissions', e);
        return;
    }

    const endTime = new Date();
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 24);

    let stepsRecords: any[] = [];
    try {
        const stepsResult = await HealthConnect.readRecords({
          type: 'Steps',
          timeRangeFilter: {
            type: 'between',
            startTime: startTime,
            endTime: endTime
          },
        });
        stepsRecords = stepsResult.records || [];
    } catch (e) {
        console.warn('Steps data fetch failed');
    }

    let restingHeartRate = 0;
    try {
      const hrResult = await HealthConnect.readRecords({
        type: 'RestingHeartRate',
        timeRangeFilter: {
          type: 'between',
          startTime: startTime,
          endTime: endTime
        },
      });
      if (hrResult && hrResult.records && hrResult.records.length > 0) {
        restingHeartRate = hrResult.records[hrResult.records.length - 1].beatsPerMinute || 0;
      }
    } catch (e) {
      console.warn('Resting HR data fetch failed');
    }

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

        if (sleepResult && sleepResult.records) {
            sleepMinutes = (sleepResult.records as any[]).reduce((total, r) => {
                if (!r.startTime || !r.endTime) return total;
                return total + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
            }, 0);
        }
    } catch (e) {
        console.warn('Sleep data fetch failed');
    }

    applyEnergyFormula(sleepMinutes, stepsRecords, restingHeartRate);
  } catch (error) {
    console.error('Health Sync Error:', error);
  }
}

function applyEnergyFormula(sleepMinutes: number, stepsRecords: any[], restingHR: number) {
  try {
    const state = store.getState();
    const totalSteps = (stepsRecords || []).reduce((total, r: any) => total + (r.count || 0), 0);

    // 1. Calculate Energy
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

    // 2. Early Overload Warning Logic (§3.6)
    let risk: 'low' | 'moderate' | 'high' = 'low';

    // Criteria A: Resting HR elevation (Stress marker)
    const isHRElevated = (restingHR || 0) > 85;

    // Criteria B: Calendar Load
    const today = new Date().toDateString();
    const heavyDay = (state.calendarEvents || []).filter(e => e && e.startTime && new Date(e.startTime).toDateString() === today).length > 4;

    // Criteria C: Energy trend
    const lowEnergy = state.currentEnergy < 30;

    if ((isHRElevated && heavyDay) || (lowEnergy && isHRElevated)) {
      risk = 'high';
    } else if (isHRElevated || heavyDay || lowEnergy) {
      risk = 'moderate';
    }

    store.setOverloadRisk(risk);
  } catch (e) {
    console.error('Error in applyEnergyFormula:', e);
  }
}
