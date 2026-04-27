/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import AlarmScreen from './components/AlarmScreen';
import { Droplets, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { alarmManager } from './lib/alarm';
import { notificationManager } from './lib/notifications';
import { alarmNativeManager } from './lib/alarmNative';
import { motion, AnimatePresence } from 'motion/react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapApp } from '@capacitor/app';

import { isNative } from './lib/platform';

export default function App() {
  const {
    profile,
    theme,
    isAlarmRinging,
    isAlarmUIVisible,
    setAlarmRinging,
    alarmTune,
    activeTab,
    setActiveTab,
    getNextAlarmTime,
    isAlarmEnabled,
    intakeRecords
  } = useStore();

  // Initialize Notifications and App Lifecycle
  useEffect(() => {
    if (!isNative()) return;

    notificationManager.init();

    // Request all 4 required permissions in sequence
    const requestPermissions = async () => {
      // 1. Notification permission
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // 2. Overlay ("Display over other apps") permission
      const overlayGranted = await alarmNativeManager.checkOverlayPermission();
      if (!overlayGranted) {
        const confirm = window.confirm(
          "For the alarm pop-up to work, please enable 'Display over other apps' for AquaAlarm in the next screen."
        );
        if (confirm) {
          await alarmNativeManager.requestOverlayPermission();
        }
      }

      // 3. Battery optimization exemption
      const batteryGranted = await alarmNativeManager.checkBatteryPermission();
      if (!batteryGranted) {
        const batteryConfirm = window.confirm(
          "To ensure alarms work reliably in the background, please allow AquaAlarm to run without battery restrictions."
        );
        if (batteryConfirm) {
          await alarmNativeManager.requestBatteryPermission();
        }
      }
    };
    requestPermissions();

    // Listen for notification taps → open alarm screen
    const notificationListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      () => {
        setAlarmRinging(true);
        setActiveTab('dashboard');
      }
    );

    // Handle App foreground/background transitions
    const appStateListener = CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        // Was the app launched by the native alarm intent?
        const isTriggered = await alarmNativeManager.isAlarmTriggered();
        if (isTriggered) {
          setAlarmRinging(true);
        } else {
          // Fallback: did we miss an alarm while backgrounded?
          const next = getNextAlarmTime();
          if (next && Date.now() >= next && isAlarmEnabled) {
            setAlarmRinging(true);
          }
        }
      }
    });

    // Initial check on cold launch
    alarmNativeManager.isAlarmTriggered().then(isTriggered => {
      if (isTriggered) setAlarmRinging(true);
    });

    return () => {
      notificationListener.then(h => h.remove());
      appStateListener.then(h => h.remove());
    };
  }, [setAlarmRinging, setActiveTab, getNextAlarmTime, isAlarmEnabled]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!isNative()) return;

    const backButtonListener = CapApp.addListener('backButton', () => {
      if (isAlarmRinging || isAlarmUIVisible) return; // Let alarm UI handle it

      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(h => h.remove());
    };
  }, [activeTab, setActiveTab, isAlarmRinging, isAlarmUIVisible]);

  // Schedule / cancel the native alarm whenever the next alarm time changes
  useEffect(() => {
    if (!profile || !isAlarmEnabled) {
      notificationManager.cancelAll();
      alarmNativeManager.cancelAlarm();
      return;
    }

    const nextTime = getNextAlarmTime();
    if (nextTime) {
      const msg = "It's time to drink water!";
      notificationManager.schedule(nextTime, msg);
      alarmNativeManager.setAlarm(nextTime, msg);
    } else {
      notificationManager.cancelAll();
      alarmNativeManager.cancelAlarm();
    }
  }, [profile, isAlarmEnabled, getNextAlarmTime, intakeRecords]);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-blue');
    document.documentElement.classList.add(`theme-${theme}`);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Play / stop alarm audio
  useEffect(() => {
    if (isAlarmRinging) {
      alarmManager.play(alarmTune);
    } else {
      alarmManager.stop();
      // Also stop the Android ForegroundService so the notification goes away
      alarmNativeManager.dismissAlarm();
    }
    return () => alarmManager.stop();
  }, [isAlarmRinging, alarmTune]);

  // Polling fallback — catches alarms while the app is open
  useEffect(() => {
    if (!profile || !isAlarmEnabled) return;

    const interval = setInterval(() => {
      const nextAlarm = getNextAlarmTime();
      if (nextAlarm && Date.now() >= nextAlarm && !isAlarmRinging) {
        setAlarmRinging(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [profile, isAlarmEnabled, isAlarmRinging, getNextAlarmTime, setAlarmRinging]);

  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Alarm Screen Overlay */}
      <AnimatePresence>
        {isAlarmUIVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <AlarmScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-card border-t border-border/50 px-6 py-4 flex justify-between items-center z-10">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <Droplets className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Today</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'history' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">History</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
        </button>
      </nav>
    </div>
  );
}
