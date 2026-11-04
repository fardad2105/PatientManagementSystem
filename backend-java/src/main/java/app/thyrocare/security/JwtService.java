package app.thyrocare.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.SecretKey;

import app.thyrocare.domain.User;
import app.thyrocare.repository.Repositories.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {
    public static final Duration ACCESS_TTL = Duration.ofMinutes(15);
    public static final Duration REFRESH_TTL = Duration.ofDays(7);

    private final SecretKey key;
    private final UserRepository users;

    public JwtService(@Value("${app.jwt-secret}") String secret, UserRepository users) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.users = users;
    }

    public String create(User user, String type) {
        Duration ttl = "access".equals(type) ? ACCESS_TTL : REFRESH_TTL;
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("ver", user.getTokenVersion())
                .claim("type", type)
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plus(ttl)))
                .signWith(key)
                .compact();
    }

    /** Re-reads the user on every call so disabled accounts and changed passwords take effect immediately. */
    public Optional<User> resolve(String token, String type) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!type.equals(claims.get("type", String.class))) return Optional.empty();
            Integer version = claims.get("ver", Integer.class);
            return users.findById(UUID.fromString(claims.getSubject()))
                    .filter(u -> !u.isBlocked() && version != null && version == u.getTokenVersion());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
