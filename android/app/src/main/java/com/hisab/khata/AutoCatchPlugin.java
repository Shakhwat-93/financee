package com.hisab.khata;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "AutoCatch")
public class AutoCatchPlugin extends Plugin {

    private static AutoCatchPlugin activeInstance;

    @Override
    public void load() {
        super.load();
        activeInstance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (activeInstance == this) {
            activeInstance = null;
        }
        super.handleOnDestroy();
    }

    public static void emitLiveEvent(JSONObject json) {
        if (activeInstance == null || json == null) return;
        try {
            JSObject data = JSObject.fromJSONObject(json);
            activeInstance.notifyListeners("paymentDetected", data, true);
        } catch (Exception ignored) {
        }
    }

    private boolean hasNotificationAccess() {
        Context ctx = getContext();
        if (ctx == null) return false;
        String pkgName = ctx.getPackageName();
        final String flat = Settings.Secure.getString(
            ctx.getContentResolver(),
            "enabled_notification_listeners"
        );
        if (!TextUtils.isEmpty(flat)) {
            final String[] names = flat.split(":");
            for (String name : names) {
                final ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(pkgName, cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }

    @PluginMethod
    public void isPermissionGranted(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasNotificationAccess());
        call.resolve(ret);
    }

    @PluginMethod
    public void openPermissionSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open Notification Access settings", e);
        }
    }

    @PluginMethod
    public void getConfig(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(
            PaymentNotificationListener.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        JSObject ret = new JSObject();
        ret.put("enabled", prefs.getBoolean(PaymentNotificationListener.KEY_ENABLED, true));
        ret.put("autoPost", prefs.getBoolean(PaymentNotificationListener.KEY_AUTO_POST, true));
        ret.put("granted", hasNotificationAccess());
        call.resolve(ret);
    }

    @PluginMethod
    public void setConfig(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(
            PaymentNotificationListener.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        SharedPreferences.Editor ed = prefs.edit();
        if (call.hasOption("enabled")) {
            ed.putBoolean(PaymentNotificationListener.KEY_ENABLED, Boolean.TRUE.equals(call.getBoolean("enabled", true)));
        }
        if (call.hasOption("autoPost")) {
            ed.putBoolean(PaymentNotificationListener.KEY_AUTO_POST, Boolean.TRUE.equals(call.getBoolean("autoPost", true)));
        }
        ed.apply();
        getConfig(call);
    }

    @PluginMethod
    public void getPendingEvents(PluginCall call) {
        JSONArray raw = PaymentNotificationListener.drainQueue(getContext());
        JSArray arr = new JSArray();
        for (int i = 0; i < raw.length(); i++) {
            JSONObject obj = raw.optJSONObject(i);
            if (obj != null) {
                try {
                    arr.put(JSObject.fromJSONObject(obj));
                } catch (Exception ignored) {
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("events", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void simulateTest(PluginCall call) {
        String title = call.getString("title", "bKash");
        String text = call.getString("text", "You have received Cash In Tk 1,000.00 from 01700000000. Balance Tk 5,000.00");
        JSONObject parsed = PaymentNotificationListener.parsePayment("com.bKash.customerapp", title, text, System.currentTimeMillis());
        if (parsed == null) {
            call.reject("Could not parse amount or transaction type from notification text");
            return;
        }
        try {
            JSObject ret = JSObject.fromJSONObject(parsed);
            emitLiveEvent(parsed);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Parse error", e);
        }
    }
}
