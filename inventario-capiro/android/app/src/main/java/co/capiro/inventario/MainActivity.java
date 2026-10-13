package co.capiro.inventario;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Envoltura nativa de Inventario Capiro: carga la app web local y guarda archivos en Descargas. */
public class MainActivity extends Activity {
    private static final int ELEGIR_ARCHIVO = 41;
    private WebView web;
    private ValueCallback<Uri[]> callbackArchivo;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B0B0A);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Puente(), "AndroidApp");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (callbackArchivo != null) callbackArchivo.onReceiveValue(null);
                callbackArchivo = cb;
                try {
                    startActivityForResult(p.createIntent(), ELEGIR_ARCHIVO);
                } catch (Exception e) {
                    callbackArchivo = null;
                    return false;
                }
                return true;
            }
        });

        if (estado != null) web.restoreState(estado);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == ELEGIR_ARCHIVO && callbackArchivo != null) {
            callbackArchivo.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            callbackArchivo = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    /** Métodos visibles para JavaScript como window.AndroidApp. */
    private class Puente {
        @JavascriptInterface
        public String saveFile(String nombre, String contenido, String mime) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return "no";
            try {
                ContentResolver cr = getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, nombre);
                v.put(MediaStore.Downloads.MIME_TYPE, mime == null ? "text/plain" : mime);
                v.put(MediaStore.Downloads.RELATIVE_PATH, "Download/Inventario Capiro");
                Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return "no";
                try (OutputStream os = cr.openOutputStream(uri)) {
                    os.write(contenido.getBytes(StandardCharsets.UTF_8));
                }
                return "ok";
            } catch (Exception e) {
                return "no";
            }
        }
    }
}
