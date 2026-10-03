
package com.henoria.ecommerce.security;

import com.henoria.ecommerce.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserPrincipal implements UserDetails {

    private final User user;

    public UserPrincipal(User user) {
        this.user = Objects.requireNonNull(
                user,
                "User cannot be null"
        );
    }

    /**
     * Returns the complete logged-in user entity.
     */
    public User getUser() {
        return user;
    }

    /**
     * Returns logged-in user ID.
     */
    public Long getId() {
        return user.getId();
    }

    /**
     * Spring Security authorities.
     *
     * Example:
     * USER  -> ROLE_USER
     * ADMIN -> ROLE_ADMIN
     * SELLER -> ROLE_SELLER
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        if (user.getRole() == null) {
            return List.of();
        }

        return List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + user.getRole().name()
                )
        );
    }

    /**
     * Returns encrypted password stored in the database.
     */
    @Override
    public String getPassword() {
        return user.getPassword();
    }

    /**
     * Email is being used as the Spring Security username.
     */
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    /**
     * Account expiry is not currently implemented.
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Account locking is not currently implemented.
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Credential expiry is not currently implemented.
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Only active users are allowed to authenticate.
     */
    @Override
    public boolean isEnabled() {
        return user.isActive();
    }
}

