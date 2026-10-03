package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.auth.AuthResponse;
import com.henoria.ecommerce.dto.auth.ForgotPasswordRequest;
import com.henoria.ecommerce.dto.auth.LoginRequest;
import com.henoria.ecommerce.dto.auth.RegisterRequest;
import com.henoria.ecommerce.dto.auth.ResetPasswordRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
