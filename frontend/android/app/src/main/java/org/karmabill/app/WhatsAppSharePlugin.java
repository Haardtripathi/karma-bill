package org.karmabill.app;

import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "WhatsAppShare")
public class WhatsAppSharePlugin extends Plugin {
    private static final String WHATSAPP = "com.whatsapp";
    private static final String WHATSAPP_BUSINESS = "com.whatsapp.w4b";

    @PluginMethod
    public void share(PluginCall call) {
        String fileUrl = call.getString("fileUrl");
        String text = call.getString("text", "");
        String phone = call.getString("phone", "");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (fileUrl == null || !fileUrl.startsWith("file:")) {
            call.reject("A file:// URL is required");
            return;
        }

        Uri fileUri = Uri.parse(fileUrl);
        File file = new File(fileUri.getPath());
        if (!file.exists()) {
            call.reject("Shared file does not exist");
            return;
        }

        Uri contentUri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            file
        );

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_STREAM, contentUri);
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { mimeType });
        if (!text.isEmpty()) {
            intent.putExtra(Intent.EXTRA_TEXT, text);
            intent.putExtra(Intent.EXTRA_SUBJECT, text);
            intent.putExtra(Intent.EXTRA_TITLE, text);
        }

        String jid = toWhatsappJid(phone);
        if (!jid.isEmpty()) {
            intent.putExtra("jid", jid);
        }

        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.setClipData(ClipData.newRawUri("invoice", contentUri));

        if (tryStart(intent, WHATSAPP)) {
            resolve(call, WHATSAPP);
            return;
        }
        if (tryStart(intent, WHATSAPP_BUSINESS)) {
            resolve(call, WHATSAPP_BUSINESS);
            return;
        }

        call.reject("WhatsApp is not installed");
    }

    private boolean tryStart(Intent baseIntent, String packageName) {
        Intent intent = new Intent(baseIntent);
        intent.setPackage(packageName);
        try {
            Uri streamUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (streamUri != null) {
                getContext().grantUriPermission(packageName, streamUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
            getActivity().startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException error) {
            return false;
        }
    }

    private String toWhatsappJid(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        return digits.isEmpty() ? "" : digits + "@s.whatsapp.net";
    }

    private void resolve(PluginCall call, String packageName) {
        JSObject result = new JSObject();
        result.put("packageName", packageName);
        call.resolve(result);
    }
}
