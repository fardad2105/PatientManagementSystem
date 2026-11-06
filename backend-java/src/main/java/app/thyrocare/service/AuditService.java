package app.thyrocare.service;

import app.thyrocare.domain.AuditLog;
import app.thyrocare.domain.User;
import app.thyrocare.repository.Repositories.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository repo;

    public void log(User actor, String action, String resourceType, Object resourceId) {
        log(actor, action, resourceType, resourceId, "allow", null);
    }

    public void log(User actor, String action, String resourceType, Object resourceId, String outcome, String details) {
        AuditLog entry = new AuditLog();
        if (actor != null) {
            entry.setActorId(actor.getId());
            entry.setActorEmail(actor.getEmail());
            entry.setActorRole(actor.getRole().name());
            entry.setActorName(actor.getName());
        }
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setResourceId(resourceId == null ? null : resourceId.toString());
        entry.setOutcome(outcome);
        entry.setDetails(details);
        entry.setIpAddress(clientIp());
        repo.save(entry);
    }

    private static String clientIp() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) return null;
        HttpServletRequest req = attrs.getRequest();
        String fwd = req.getHeader("X-Forwarded-For");
        String ip = fwd != null && !fwd.isBlank() ? fwd.split(",")[0].trim() : req.getRemoteAddr();
        return ip == null ? null : ip.substring(0, Math.min(ip.length(), 64));
    }
}
