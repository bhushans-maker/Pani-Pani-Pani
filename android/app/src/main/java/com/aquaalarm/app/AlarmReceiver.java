package com.aquaalarm.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String message = intent.getStringExtra("message");
        if (message == null) message = "It's time to drink water!";

        // Start the ForegroundService — this is the only reliable way to
        // show a heads-up / full-screen notification on Android 13+
        Intent serviceIntent = new Intent(context, WaterAlarmService.class);
        serviceIntent.putExtra("message", message);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
