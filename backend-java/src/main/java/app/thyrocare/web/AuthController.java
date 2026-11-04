package app.thyrocare.web;

import java.util.Map;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.User;
import app.thyrocare.security.AuthCookies;
import app.thyrocare.security.JwtService;
import app.thyrocare.service.AuthService;
import app.thyrocare.web.Dtos.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    private final AuthCookies cookies;
    private final JwtService jwt;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/auth/register")
    public UserDto register(@Valid @RequestBody RegisterRequest body, HttpServletResponse res) {
        User u = auth.register(body);
        cookies.set(res, u);
        return UserDto.from(u);
    }

    @PostMapping("/auth/login")
    public UserDto login(@Valid @RequestBody LoginRequest body, HttpServletResponse res) {
        User u = auth.login(body);
        cookies.set(res, u);
        return UserDto.from(u);
    }

    @PostMapping("/auth/logout")
    public Map<String, Boolean> logout(HttpServletResponse res) {
        cookies.clear(res);
        return Map.of("ok", true);
    }

    @GetMapping("/auth/me")
    public UserDto me(@AuthenticationPrincipal User user) {
        return UserDto.from(user);
    }

    @PostMapping("/auth/refresh")
    public UserDto refresh(@CookieValue(name = "refresh_token", required = false) String token, HttpServletResponse res) {
        User u = token == null ? null : jwt.resolve(token, "refresh").orElse(null);
        if (u == null) {
            cookies.clear(res);
            throw ApiException.unauthorized("نشست شما معتبر نیست؛ دوباره وارد شوید");
        }
        cookies.set(res, u);
        return UserDto.from(u);
    }

    @PostMapping("/auth/change-password")
    public Map<String, Boolean> changePassword(@Valid @RequestBody ChangePasswordRequest body,
                                               @AuthenticationPrincipal User user, HttpServletResponse res) {
        cookies.set(res, auth.changePassword(user, body));
        return Map.of("ok", true);
    }
}
