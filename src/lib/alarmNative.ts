import { registerPlugin } from '@capacitor/core';
import { isNative } from './platform';

export interface AlarmPlugin {
  setAlarm(options: { timestamp: number; message: string }): Promise<void>;
  cancelAlarm(): Promise<void>;
  dismissAlarm(): Promise<void>;
  getAlarmStatus(): Promise<{ isAlarmTriggered: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  checkBatteryPermission(): Promise<{ granted: boolean }>;
  requestBatteryPermission(): Promise<void>;
}

const NativeAlarm = registerPlugin<AlarmPlugin>('AlarmPlugin');

export const alarmNativeManager = {
  async setAlarm(timestamp: number, message: string) {
    if (!isNative()) {
      console.log(`[Web] Simulated Native Alarm set for ${new Date(timestamp).toLocaleString()}: ${message}`);
      return;
    }
    try {
      await NativeAlarm.setAlarm({ timestamp, message });
      // Persist the next alarm time in localStorage so BootReceiver can read it
      // (the native side reads from SharedPreferences — see BootReceiver.java)
      localStorage.setItem('nextAlarmTimestamp', String(timestamp));
      localStorage.setItem('nextAlarmMessage', message);
    } catch (error) {
      console.error('Error setting native alarm:', error);
    }
  },

  async cancelAlarm() {
    if (!isNative()) return;
    try {
      await NativeAlarm.cancelAlarm();
      localStorage.removeItem('nextAlarmTimestamp');
      localStorage.removeItem('nextAlarmMessage');
    } catch (error) {
      console.error('Error cancelling native alarm:', error);
    }
  },

  async dismissAlarm() {
    if (!isNative()) return;
    try {
      await NativeAlarm.dismissAlarm();
    } catch (error) {
      console.error('Error dismissing alarm service:', error);
    }
  },

  async isAlarmTriggered() {
    if (!isNative()) return false;
    try {
      const { isAlarmTriggered } = await NativeAlarm.getAlarmStatus();
      return isAlarmTriggered;
    } catch (error) {
      console.error('Error checking alarm status:', error);
      return false;
    }
  },

  async checkOverlayPermission() {
    if (!isNative()) return true;
    try {
      const { granted } = await NativeAlarm.checkOverlayPermission();
      return granted;
    } catch (error) {
      return true;
    }
  },

  async requestOverlayPermission() {
    if (!isNative()) return;
    try {
      await NativeAlarm.requestOverlayPermission();
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
    }
  },

  async checkBatteryPermission() {
    if (!isNative()) return true;
    try {
      const { granted } = await NativeAlarm.checkBatteryPermission();
      return granted;
    } catch (error) {
      return true;
    }
  },

  async requestBatteryPermission() {
    if (!isNative()) return;
    try {
      await NativeAlarm.requestBatteryPermission();
    } catch (error) {
      console.error('Error requesting battery permission:', error);
    }
  }
};
