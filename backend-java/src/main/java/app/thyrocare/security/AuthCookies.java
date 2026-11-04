package app.thyrocare.security;

import java.time.Duration;

import app.thyrocare.domain.User;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class AuthCookies {
    private final JwtService jwt;
    private final boolean secure;

    public AuthCookies(JwtService jwt, @Value("${app.cookie-secure}") boolean secure) {
        this.jwt = jwt;
        this.secure = secure;
    }

    public void set(HttpServletResponse response, User user) {
        add(response, "access_token", jwt.create(user, "access"), JwtService.ACCESS_TTL);
        add(response, "refresh_token", jwt.create(user, "refresh"), JwtService.REFRESH_TTL);
    }

    public void clear(HttpServletResponse response) {
        add(response, "access_token", "", Duration.ZERO);
        add(response, "refresh_token", "", Duration.ZERO);
    }

    private void add(HttpServletResponse response, String name, String value, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true).secure(secure).sameSite("Lax").path("/").maxAge(maxAge).build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
