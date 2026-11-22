package com.hisab.khata;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;

public class PaymentNotificationListener extends NotificationListenerService {

    public static final String PREFS_NAME = "hisab_autocatch_prefs";
    public static final String KEY_ENABLED = "enabled";
    public static final String KEY_AUTO_POST = "auto_post";
    public static final String KEY_QUEUE = "pending_queue";

    private static String lastSig = "";
    private static long lastSigTime = 0L;

    // Keywords for Cash In (Income) & Cash Out (Expense)
    private static final Pattern INCOME_PATTERN = Pattern.compile(
        "(cash[\\s\\-]?in|received|add[\\s\\-]?money|credited|deposited|deposit|money[\\s\\-]?in|refund|" +
        "ক্যাশ[\\s\\-]?ইন|অ্যাড[\\s\\-]?মানি|টাকা\\s*এসেছে|পেয়েছেন|পেয়েছেন|জমা\\s*হয়েছে|জমা\\s*হয়েছে|প্রাপ্ত)",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern EXPENSE_PATTERN = Pattern.compile(
        "(cash[\\s\\-]?out|send[\\s\\-]?money|sent\\s+tk|sent\\s+bdt|payment|paid\\s+|debited|withdrawn|withdraw|" +
        "purchase|mobile\\s*recharge|recharged|bill\\s*pay|" +
        "ক্যাশ[\\s\\-]?আউট|সেন্ড[\\s\\-]?মানি|পেমেন্ট|পাঠানো\\s*হয়েছে|পাঠানো\\s*হয়েছে|কেটে\\s*নেওয়া|কেটে\\s*নেওয়া|খরচ|রিচার্জ)",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Strip trailing balance info so we never capture account balance instead of tx amount
    private static final Pattern BALANCE_CUT = Pattern.compile(
        "(new\\s+balance|current\\s+balance|available\\s+balance|balance|bal\\b|ব্যালেন্স|বর্তমান\\s*ব্যালেন্স).*",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.DOTALL
    );

    // Amount patterns: "Tk 1,500.00", "BDT 500", "৳1000", "$25.50", "1,500 Tk", "500 টাকা"
    private static final Pattern AMT_PREFIX = Pattern.compile(
        "(?:tk\\.?|bdt|৳|\\$|taka)\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern AMT_SUFFIX = Pattern.compile(
        "([0-9][0-9,]*(?:\\.[0-9]{1,2})?)\\s*(?:tk\\.?|bdt|৳|taka|টাকা)",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        if (pkg == null || pkg.equals(getPackageName())) return;

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(KEY_ENABLED, true)) return;

        Notification notif = sbn.getNotification();
        if (notif == null) return;
        if ((notif.flags & Notification.FLAG_ONGOING_EVENT) != 0) return;

        Bundle extras = notif.extras;
        if (extras == null) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence bigTextCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);

        String title = titleCs != null ? titleCs.toString() : "";
        String body = bigTextCs != null && bigTextCs.length() > 0
            ? bigTextCs.toString()
            : (textCs != null ? textCs.toString() : "");

        if (title.isEmpty() && body.isEmpty()) return;

        JSONObject parsed = parsePayment(pkg, title, body, sbn.getPostTime());
        if (parsed == null) return;

        // Deduplicate rapid notification updates (within 20s)
        String sig = parsed.optString("type") + "_" + parsed.optDouble("amount");
        long now = System.currentTimeMillis();
        if (sig.equals(lastSig) && (now - lastSigTime) < 20000L) {
            return;
        }
        lastSig = sig;
        lastSigTime = now;

        // Persist to queue first so nothing is lost if app is closed
        enqueueEvent(this, parsed);

        // If Capacitor bridge is live, push immediately
        AutoCatchPlugin.emitLiveEvent(parsed);
    }

    public static JSONObject parsePayment(String pkg, String title, String body, long timestamp) {
        String combined = normalizeDigits((title + " " + body).trim());
        if (combined.length() < 5) return null;

        // Ignore OTP / verification code messages
        String lower = combined.toLowerCase(Locale.ROOT);
        if (lower.contains("otp") || lower.contains("verification code") || lower.contains("pin is") || lower.contains("ভেরিফিকেশন")) {
            return null;
        }

        // Determine Cash In vs Cash Out
        boolean isInc = INCOME_PATTERN.matcher(combined).find();
        boolean isExp = EXPENSE_PATTERN.matcher(combined).find();
        if (!isInc && !isExp) return null;

        // If both match (rare, e.g., "Payment received"), prioritize "received" -> income
        String type;
        if (isInc && isExp) {
            type = (lower.contains("received") || lower.contains("credited") || lower.contains("cash in") || lower.contains("add money") || lower.contains("ক্যাশ ইন"))
                ? "income"
                : "expense";
        } else {
            type = isInc ? "income" : "expense";
        }

        // Remove balance suffix before extracting amount
        String amountArea = BALANCE_CUT.matcher(combined).replaceFirst("").trim();
        double amount = extractAmount(amountArea);
        if (amount <= 0) {
            amount = extractAmount(combined);
        }
        if (amount <= 0) return null;

        String source = detectSource(pkg, lower);
        String actionLabel = type.equals("income")
            ? (lower.contains("add money") || lower.contains("অ্যাড মানি") ? "Add Money" : "Cash In")
            : (lower.contains("cash out") || lower.contains("ক্যাশ আউট") ? "Cash Out" : "Payment / Send");

        try {
            JSONObject obj = new JSONObject();
            obj.put("id", "ac_" + timestamp + "_" + Math.round(amount * 100));
            obj.put("type", type);
            obj.put("amount", Math.round(amount * 100.0) / 100.0);
            obj.put("source", source);
            obj.put("actionLabel", actionLabel);
            obj.put("title", title);
            obj.put("rawText", body.length() > 140 ? body.substring(0, 140) : body);
            obj.put("timestamp", timestamp > 0 ? timestamp : System.currentTimeMillis());
            return obj;
        } catch (Exception e) {
            return null;
        }
    }

    private static double extractAmount(String text) {
        Matcher m1 = AMT_PREFIX.matcher(text);
        if (m1.find()) {
            return parseNum(m1.group(1));
        }
        Matcher m2 = AMT_SUFFIX.matcher(text);
        if (m2.find()) {
            return parseNum(m2.group(1));
        }
        return 0;
    }

    private static double parseNum(String s) {
        if (s == null) return 0;
        try {
            return Double.parseDouble(s.replace(",", "").trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static String normalizeDigits(String input) {
        if (input == null) return "";
        char[] bn = {'০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'};
        String out = input;
        for (int i = 0; i < bn.length; i++) {
            out = out.replace(bn[i], (char) ('0' + i));
        }
        return out;
    }

    private static String detectSource(String pkg, String lower) {
        String p = pkg != null ? pkg.toLowerCase(Locale.ROOT) : "";
        if (p.contains("bkash") || lower.contains("bkash") || lower.contains("বিকাশ")) return "bKash";
        if (p.contains("nagad") || lower.contains("nagad") || lower.contains("নগদ")) return "Nagad";
        if (p.contains("dbbl") || p.contains("rocket") || lower.contains("rocket") || lower.contains("রকেট")) return "Rocket";
        if (p.contains("upay") || lower.contains("upay") || lower.contains("উপায়") || lower.contains("উপায়")) return "Upay";
        if (p.contains("cellfin") || lower.contains("islami bank") || lower.contains("cellfin")) return "Islami Bank";
        if (lower.contains("city") || lower.contains("citytouch")) return "City Bank";
        if (lower.contains("brac") || lower.contains("astha")) return "BRAC Bank";
        if (lower.contains("ebl") || lower.contains("skybanking")) return "EBL";
        if (lower.contains("bank") || lower.contains("a/c") || lower.contains("account")) return "Bank";
        return "Auto-Catch";
    }

    public static synchronized void enqueueEvent(Context ctx, JSONObject event) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_QUEUE, "[]"));
            arr.put(event);
            // Keep max 50 queued events
            while (arr.length() > 50) {
                arr.remove(0);
            }
            prefs.edit().putString(KEY_QUEUE, arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    public static synchronized JSONArray drainQueue(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_QUEUE, "[]"));
            prefs.edit().putString(KEY_QUEUE, "[]").apply();
            return arr;
        } catch (Exception e) {
            return new JSONArray();
        }
    }
}
