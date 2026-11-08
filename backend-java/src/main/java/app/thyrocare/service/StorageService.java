package app.thyrocare.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Emergent object storage over HTTP. One session storage key, re-minted once on 404/unknown key. */
@Slf4j
@Service
public class StorageService {
    private static final String APP = "thyrocare";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String baseUrl;
    private final String emergentKey;
    private volatile String storageKey;

    public StorageService(@Value("${app.storage-url}") String storageUrl, @Value("${app.emergent-key}") String emergentKey) {
        String base = storageUrl == null || storageUrl.isBlank() ? "https://integrations.emergentagent.com" : storageUrl.trim();
        this.baseUrl = base.replaceAll("/+$", "") + "/objstore/api/v1/storage";
        this.emergentKey = emergentKey;
    }

    public static String pathFor(UUID patientId, String ext) {
        return APP + "/uploads/" + patientId + "/" + UUID.randomUUID() + "." + ext;
    }

    public String put(String path, byte[] data, String contentType) {
        HttpResponse<String> r = withKey(k -> HttpRequest.newBuilder(URI.create(baseUrl + "/objects/" + path))
                .timeout(Duration.ofSeconds(120)).header("X-Storage-Key", k).header("Content-Type", contentType)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(data)).build(), HttpResponse.BodyHandlers.ofString());
        try {
            return mapper.readTree(r.body()).path("path").asText(path);
        } catch (IOException e) {
            return path;
        }
    }

    public byte[] get(String path) {
        return withKey(k -> HttpRequest.newBuilder(URI.create(baseUrl + "/objects/" + path))
                .timeout(Duration.ofSeconds(60)).header("X-Storage-Key", k).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray()).body();
    }

    private interface RequestFor {
        HttpRequest build(String key);
    }

    private <T> HttpResponse<T> withKey(RequestFor req, HttpResponse.BodyHandler<T> handler) {
        HttpResponse<T> r = send(req.build(key(false)), handler);
        if (r.statusCode() == 404) r = send(req.build(key(true)), handler);
        if (r.statusCode() / 100 != 2) {
            log.error("object storage returned {}", r.statusCode());
            throw new ApiException(HttpStatus.BAD_GATEWAY, r.statusCode() == 404 ? "فایل در فضای ذخیره‌سازی یافت نشد" : "خطا در سرویس ذخیره‌سازی فایل");
        }
        return r;
    }

    private synchronized String key(boolean force) {
        if (storageKey != null && !force) return storageKey;
        if (emergentKey == null || emergentKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "سرویس ذخیره‌سازی فایل پیکربندی نشده است");
        }
        HttpRequest init = HttpRequest.newBuilder(URI.create(baseUrl + "/init")).timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"emergent_key\":\"" + emergentKey.replace("\"", "") + "\"}")).build();
        HttpResponse<String> r = send(init, HttpResponse.BodyHandlers.ofString());
        if (r.statusCode() / 100 != 2) {
            log.error("object storage init failed: {}", r.statusCode());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "اتصال به سرویس ذخیره‌سازی ناموفق بود");
        }
        try {
            JsonNode n = mapper.readTree(r.body());
            storageKey = n.path("storage_key").asText(null);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "پاسخ نامعتبر از سرویس ذخیره‌سازی");
        }
        return storageKey;
    }

    private <T> HttpResponse<T> send(HttpRequest req, HttpResponse.BodyHandler<T> handler) {
        try {
            return http.send(req, handler);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "سرویس ذخیره‌سازی در دسترس نیست");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "سرویس ذخیره‌سازی در دسترس نیست");
        }
    }
}
