package com.aquaalarm.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

/**
 * WaterAlarmService — runs as a Foreground Service so it can reliably
 * fire a full-screen / heads-up notification even on Android 13+ devices
 * where background BroadcastReceivers are heavily restricted.
 */
public class WaterAlarmService extends Service {

    private static final String CHANNEL_ID   = "water_alarm_fg_channel";
    private static final int    NOTIF_ID     = 2001;

    private Vibrator vibrator;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String message = (intent != null) ? intent.getStringExtra("message") : null;
        if (message == null) message = "It's time to drink water!";

        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification(message));
        startVibration();

        return START_NOT_STICKY; // Don't restart automatically if killed
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
            if (existing != null) return; // Already created

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Water Alarm",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("AquaAlarm hydration reminders");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 300, 500, 300, 500});
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            AudioAttributes aa = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            channel.setSound(alarmSound, aa);

            nm.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String message) {
        // Full-screen / tap intent → opens MainActivity
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("isAlarmTriggered", true);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) piFlags |= PendingIntent.FLAG_IMMUTABLE;

        PendingIntent fullScreenPi = PendingIntent.getActivity(this, 0, launchIntent, piFlags);

        // Dismiss / stop-service action
        Intent dismissIntent = new Intent(this, WaterAlarmService.class);
        dismissIntent.setAction("DISMISS_ALARM");
        PendingIntent dismissPi = PendingIntent.getService(this, 1, dismissIntent, piFlags);

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("💧 AquaAlarm — Time to Hydrate!")
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPi, true)
                .setContentIntent(fullScreenPi)
                .setSound(alarmSound)
                .setVibrate(new long[]{0, 500, 300, 500, 300, 500})
                .setOngoing(true)
                .setAutoCancel(false)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismissPi)
                .build();
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;

        long[] pattern = {0, 500, 300, 500, 300, 500};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = repeat from start
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }
}
