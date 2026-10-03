package com.henoria.ecommerce.dto.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContactRequest {
    @NotBlank
    private String name;

    @NotBlank @Email
    private String email;

    private String phone;
    private String subject;

    @NotBlank
    private String message;
}
