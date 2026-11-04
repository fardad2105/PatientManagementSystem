package app.thyrocare.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.*;
import app.thyrocare.repository.Repositories.LoginAttemptRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Dtos.ChangePasswordRequest;
import app.thyrocare.web.Dtos.LoginRequest;
import app.thyrocare.web.Dtos.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final String LOCKED = "به دلیل تلاش‌های ناموفق متعدد، ورود به مدت ۱۵ دقیقه مسدود شد";

    private final UserRepository users;
    private final LoginAttemptRepository attempts;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    @Transactional
    public User register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw ApiException.badRequest("این ایمیل قبلاً ثبت شده است");
        User u = new User();
        u.setEmail(email);
        u.setName(r.name().trim());
        u.setPhone(r.phone());
        u.setRole(Role.patient);
        u.setStatus(UserStatus.pending);
        u.setPasswordHash(encoder.encode(r.password()));
        users.save(u);
        audit.log(u, "register", "user", u.getId());
        return u;
    }

    /** Lockout is keyed per account (not IP) because proxies hide the real client address. */
    @Transactional(noRollbackFor = ApiException.class)
    public User login(LoginRequest r) {
        String email = r.email().trim().toLowerCase();
        Instant now = Instant.now();
        LoginAttempt attempt = attempts.findForUpdate(email).orElse(null);
        if (attempt != null && attempt.getLockedUntil() != null && attempt.getLockedUntil().isAfter(now)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, LOCKED);
        }
        User u = users.findByEmail(email).orElse(null);
        if (u == null || !encoder.matches(r.password(), u.getPasswordHash())) {
            if (attempt == null) attempt = new LoginAttempt(email);
            attempt.setAttemptCount(attempt.getAttemptCount() + 1);
            attempt.setUpdatedAt(now);
            audit.log(null, "login_failed", "user", null, "deny", email);
            if (attempt.getAttemptCount() >= MAX_ATTEMPTS) {
                attempt.setAttemptCount(0);
                attempt.setLockedUntil(now.plus(LOCK_MINUTES, ChronoUnit.MINUTES));
                attempts.save(attempt);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, LOCKED);
            }
            attempts.save(attempt);
            throw ApiException.unauthorized("ایمیل یا رمز عبور اشتباه است");
        }
        if (u.getStatus() == UserStatus.rejected) throw ApiException.forbidden("درخواست ثبت‌نام شما توسط مدیر سیستم رد شده است");
        if (u.getStatus() == UserStatus.disabled) throw ApiException.forbidden("حساب کاربری شما غیرفعال شده است");
        if (attempt != null) attempts.delete(attempt);
        audit.log(u, "login", "user", u.getId());
        return u;
    }

    @Transactional
    public User changePassword(User principal, ChangePasswordRequest r) {
        User u = users.findById(principal.getId()).orElseThrow(() -> ApiException.unauthorized("حساب یافت نشد"));
        if (!encoder.matches(r.currentPassword(), u.getPasswordHash())) {
            throw ApiException.badRequest("رمز عبور فعلی اشتباه است");
        }
        u.setPasswordHash(encoder.encode(r.newPassword()));
        u.setPasswordChangedAt(Instant.now());
        u.setTokenVersion(u.getTokenVersion() + 1);
        audit.log(u, "change_password", "user", u.getId());
        return u;
    }
}
