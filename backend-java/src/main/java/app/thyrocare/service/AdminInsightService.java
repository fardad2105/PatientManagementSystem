package app.thyrocare.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import app.thyrocare.domain.Role;
import app.thyrocare.domain.UserStatus;
import app.thyrocare.repository.Repositories.AuditLogRepository;
import app.thyrocare.repository.Repositories.EducationContentRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Dtos.AdminDashboardDto;
import app.thyrocare.web.Dtos.AuditDto;
import app.thyrocare.web.Dtos.DayCount;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Operational statistics for the admin panel. Contains no clinical data. */
@Service
@RequiredArgsConstructor
public class AdminInsightService {
    private static final int REG_DAYS = 180;
    private static final int LOGIN_DAYS = 14;

    private final UserRepository users;
    private final AuditLogRepository auditLogs;
    private final EducationContentRepository education;
    private final JdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public AdminDashboardDto dashboard() {
        LocalDate today = LocalDate.now(PhysicianInsightService.ZONE);
        Instant startToday = startOf(today);
        Instant regFrom = startOf(today.minusDays(REG_DAYS - 1));
        Instant loginFrom = startOf(today.minusDays(LOGIN_DAYS - 1));

        Map<LocalDate, Long> reg = emptyDays(today, REG_DAYS);
        users.findByRoleAndCreatedAtGreaterThanEqual(Role.patient, regFrom)
                .forEach(u -> reg.merge(day(u.getCreatedAt()), 1L, Long::sum));
        Map<LocalDate, Long> logins = emptyDays(today, LOGIN_DAYS);
        auditLogs.findByActionAndCreatedAtGreaterThanEqual("login", loginFrom)
                .forEach(a -> logins.merge(day(a.getCreatedAt()), 1L, Long::sum));

        long t0 = System.nanoTime();
        boolean dbOk;
        try {
            dbOk = Integer.valueOf(1).equals(jdbc.queryForObject("select 1", Integer.class));
        } catch (RuntimeException e) {
            dbOk = false;
        }
        long latency = (System.nanoTime() - t0) / 1_000_000;

        List<AuditDto> recent = auditLogs.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 6)).stream().map(AuditDto::from).toList();
        return new AdminDashboardDto(
                users.countByRoleAndStatus(Role.patient, UserStatus.active),
                users.countByRoleAndStatus(Role.patient, UserStatus.pending),
                users.countByRoleAndStatus(Role.physician, UserStatus.active),
                auditLogs.countByActionAndCreatedAtGreaterThanEqual("login", startToday),
                auditLogs.countByActionAndCreatedAtGreaterThanEqual("login_failed", startToday),
                education.countByStatus("published"), education.count(),
                dbOk, latency, Instant.now(),
                users.countByRoleAndCreatedAtBefore(Role.patient, regFrom),
                toList(reg), toList(logins), recent);
    }

    private static Instant startOf(LocalDate d) {
        return d.atStartOfDay(PhysicianInsightService.ZONE).toInstant();
    }

    private static LocalDate day(Instant i) {
        return i.atZone(PhysicianInsightService.ZONE).toLocalDate();
    }

    private static Map<LocalDate, Long> emptyDays(LocalDate today, int n) {
        Map<LocalDate, Long> m = new LinkedHashMap<>();
        for (int i = n - 1; i >= 0; i--) m.put(today.minus(i, ChronoUnit.DAYS), 0L);
        return m;
    }

    private static List<DayCount> toList(Map<LocalDate, Long> m) {
        return m.entrySet().stream().map(e -> new DayCount(e.getKey(), e.getValue())).toList();
    }
}
