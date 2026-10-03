package com.henoria.ecommerce.config;

import com.henoria.ecommerce.security.CustomUserDetailsService;
import com.henoria.ecommerce.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * Password encryption bean.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Connects Spring Security authentication with the application's
     * CustomUserDetailsService and BCrypt password encoder.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    /**
     * AuthenticationManager is used by login APIs.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }

    /**
     * Main Spring Security configuration.
     */
    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http
    ) throws Exception {

        http
                // JWT based APIs do not need CSRF protection.
                .csrf(csrf -> csrf.disable())

                // Enable configured CORS rules.
                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )

                // Do not create server-side HTTP sessions.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth
                		   .requestMatchers(
                                   "/actuator/health",
                                   "/actuator/info",
                                   "/actuator/prometheus"
                               ).permitAll()
                        /*
                         * Swagger and OpenAPI endpoints.
                         * These must be public, otherwise Swagger may show 401/403.
                         */
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**"
                        ).permitAll()

                        /*
                         * Authentication endpoints such as login,
                         * registration and refresh-token.
                         */
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        /*
                         * Public GET APIs & Guest Cart/Wishlist
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products/**",
                                "/api/categories/**",
                                "/api/reviews/**",
                                "/api/coupons/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/cart/**",
                                "/api/wishlist/**"
                        ).permitAll()

                        /*
                         * Public contact form.
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/contact",
                                "/api/orders"
                        ).permitAll()

                        /*
                         * Public uploaded images/files.
                         */
                        .requestMatchers(
                                "/uploads/**"
                        ).permitAll()

                        /*
                         * Only ADMIN role can access admin APIs.
                         *
                         * hasRole("ADMIN") expects the stored authority
                         * to be ROLE_ADMIN.
                         */
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        /*
                         * All remaining APIs require JWT authentication.
                         */
                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())

                /*
                 * JWT filter runs before Spring Security's
                 * username/password authentication filter.
                 */
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * CORS configuration for the frontend applications.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        List<String> origins = Arrays.stream(
                        allowedOrigins.split(",")
                )
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();

        List<String> patterns = new java.util.ArrayList<>(origins);
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");

        configuration.setAllowedOriginPatterns(patterns);

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(List.of("*"));
        // Explicitly allow X-Guest-Id in exposed and allowed if needed, though * covers allowed.
        configuration.setExposedHeaders(
                List.of(
                        "Authorization",
                        "Content-Disposition",
                        "X-Guest-Id"
                )
        );

        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}