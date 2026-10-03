package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.auth.AuthResponse;
import com.henoria.ecommerce.dto.auth.ForgotPasswordRequest;
import com.henoria.ecommerce.dto.auth.LoginRequest;
import com.henoria.ecommerce.dto.auth.RegisterRequest;
import com.henoria.ecommerce.dto.auth.ResetPasswordRequest;
import com.henoria.ecommerce.entity.Cart;
import com.henoria.ecommerce.entity.User;
import com.henoria.ecommerce.entity.Wishlist;
import com.henoria.ecommerce.entity.enums.Role;
import com.henoria.ecommerce.exception.BadRequestException;
import com.henoria.ecommerce.exception.DuplicateResourceException;
import com.henoria.ecommerce.repository.CartRepository;
import com.henoria.ecommerce.repository.UserRepository;
import com.henoria.ecommerce.repository.WishlistRepository;
import com.henoria.ecommerce.security.JwtUtil;
import com.henoria.ecommerce.security.UserPrincipal;
import com.henoria.ecommerce.service.AuthService;
import com.henoria.ecommerce.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final WishlistRepository wishlistRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.CUSTOMER)
                .build();

        user = userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getName());

        String token = jwtUtil.generateToken(new UserPrincipal(user));
        return buildAuthResponse(user, token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(new UserPrincipal(user));
        return buildAuthResponse(user, token);
    }


    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        // Always behave the same way whether or not the email exists, so we don't
        // leak which emails are registered.
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", request.getEmail());
            return;
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        log.info("Password reset link for {}: {}", user.getEmail(), resetLink);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
