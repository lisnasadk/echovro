package com.echovro.echovro.security;

import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Service to force logout of all users.
 * When {@code forceLogoutAll} is true, JWT authentication will be ignored,
 * effectively logging out every current user until the flag is cleared.
 */
@Service
public class LogoutAllService {
    private final AtomicBoolean forceLogoutAll = new AtomicBoolean(false);

    public void enableLogoutAll() {
        forceLogoutAll.set(true);
    }

    public void disableLogoutAll() {
        forceLogoutAll.set(false);
    }

    public boolean isLogoutAllEnabled() {
        return forceLogoutAll.get();
    }
}
