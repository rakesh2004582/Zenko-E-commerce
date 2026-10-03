package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.contact.ContactRequest;
import com.henoria.ecommerce.entity.ContactMessage;
import com.henoria.ecommerce.repository.ContactMessageRepository;
import com.henoria.ecommerce.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageRepository contactMessageRepository;
    private final EmailService emailService;

    @PostMapping("/api/contact")
    public ResponseEntity<ApiResponse<Void>> submit(@Valid @RequestBody ContactRequest request) {
        ContactMessage message = ContactMessage.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .subject(request.getSubject())
                .message(request.getMessage())
                .build();
        contactMessageRepository.save(message);

        emailService.sendContactNotification(request.getName(), request.getEmail(), request.getPhone(),
                request.getSubject(), request.getMessage());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thanks for reaching out! We'll get back to you soon.", null));
    }

    @GetMapping("/api/admin/contact-messages")
    public ApiResponse<?> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        Page<ContactMessage> messages = contactMessageRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        return ApiResponse.ok(messages);
    }
}
