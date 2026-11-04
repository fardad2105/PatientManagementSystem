package app.thyrocare.service;

import app.thyrocare.domain.AuditLog;
import app.thyrocare.domain.User;
import app.thyrocare.repository.Repositories.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
        }
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setResourceId(resourceId == null ? null : resourceId.toString());
        entry.setOutcome(outcome);
        entry.setDetails(details);
        repo.save(entry);
    }
}
