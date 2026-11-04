package app.thyrocare.security;

import java.io.IOException;
import java.net.URI;
import java.util.Objects;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/** CSRF defence: cookie-authenticated writes must come from our own origin or an allow-listed one. */
public class OriginCheckFilter extends OncePerRequestFilter {
    private static final Set<String> MUTATING = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final Set<String> allowedOrigins;

    public OriginCheckFilter(Set<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (MUTATING.contains(request.getMethod()) && request.getCookies() != null && origin != null
                && !isTrusted(origin, request)) {
            response.setStatus(403);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json");
            response.getWriter().write("{\"detail\":\"درخواست از مبدأ نامعتبر\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isTrusted(String origin, HttpServletRequest request) {
        if (allowedOrigins.contains(origin)) return true;
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null) host = request.getHeader("Host");
        try {
            return Objects.equals(URI.create(origin).getAuthority(), host);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
