package app.thyrocare.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "login_attempts")
@Getter
@Setter
@NoArgsConstructor
public class LoginAttempt {
    @Id
    private String identifier;

    @Column(nullable = false)
    private int attemptCount;

    private Instant lockedUntil;
    private Instant updatedAt;

    public LoginAttempt(String identifier) {
        this.identifier = identifier;
    }
}
