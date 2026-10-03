package com.henoria.ecommerce.service;

import com.henoria.ecommerce.config.EmailJsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Sends transactional emails through EmailJS (https://www.emailjs.com) using their
 * REST API, so no SMTP server is needed. This runs server-side (order status changes,
 * signup, etc.), which is different from calling EmailJS from the browser — it requires
 * EmailJS "Private Key" auth (see https://www.emailjs.com/docs/rest-api/send/).
 *
 * If app.emailjs.enabled=false (default until you configure real EmailJS credentials in
 * .env), calls are silently skipped and just logged - the rest of the app keeps working.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate;
    private final EmailJsProperties props;

    @Async
    public void sendWelcomeEmail(String toEmail, String toName) {
        Map<String, Object> params = new HashMap<>();
        params.put("to_email", toEmail);
        params.put("to_name", toName);
        params.put("shop_name", "Henoria");
        send(props.getTemplates().getWelcome(), params, "welcome email to " + toEmail);
    }

    @Async
    public void sendOrderConfirmationEmail(String toEmail, String toName, String orderNumber,
                                            String itemsSummary, double total, String paymentMethod) {
        Map<String, Object> params = new HashMap<>();
        params.put("to_email", toEmail);
        params.put("to_name", toName);
        params.put("order_number", orderNumber);
        params.put("order_items", itemsSummary);
        params.put("order_total", String.format("%.2f", total));
        params.put("payment_method", paymentMethod);
        send(props.getTemplates().getOrderConfirmation(), params, "order confirmation for " + orderNumber);
    }

    @Async
    public void sendOrderStatusUpdateEmail(String toEmail, String toName, String orderNumber,
                                            String newStatus, String note) {
        Map<String, Object> params = new HashMap<>();
        params.put("to_email", toEmail);
        params.put("to_name", toName);
        params.put("order_number", orderNumber);
        params.put("order_status", newStatus);
        params.put("status_note", note == null ? "" : note);
        send(props.getTemplates().getOrderStatusUpdate(), params, "status update for " + orderNumber);
    }

    @Async
    public void sendContactNotification(String fromName, String fromEmail, String phone,
                                         String subject, String message) {
        Map<String, Object> params = new HashMap<>();
        params.put("to_email", props.getAdminEmail());
        params.put("from_name", fromName);
        params.put("from_email", fromEmail);
        params.put("phone", phone == null ? "-" : phone);
        params.put("subject", subject == null ? "New contact form message" : subject);
        params.put("message", message);
        send(props.getTemplates().getContact(), params, "contact form message from " + fromEmail);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String toName, String resetLink) {
        Map<String, Object> params = new HashMap<>();
        params.put("to_email", toEmail);
        params.put("to_name", toName);
        params.put("reset_link", resetLink);
        params.put("shop_name", "Henoria");
        send(props.getTemplates().getPasswordReset(), params, "password reset email to " + toEmail);
    }

    private void send(String templateId, Map<String, Object> templateParams, String logContext) {
        if (!props.isEnabled()) {
            log.info("[EmailJS disabled] Skipped sending {} (set EMAILJS_ENABLED=true in .env to activate)", logContext);
            return;
        }
        if (templateId == null || templateId.isBlank() || props.getServiceId() == null || props.getServiceId().isBlank()) {
            log.warn("[EmailJS] Missing serviceId/templateId - skipped sending {}", logContext);
            return;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("service_id", props.getServiceId());
        body.put("template_id", templateId);
        body.put("user_id", props.getPublicKey());
        if (props.getPrivateKey() != null && !props.getPrivateKey().isBlank()) {
            body.put("accessToken", props.getPrivateKey());
        }
        body.put("template_params", templateParams);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(props.getApiUrl(), new HttpEntity<>(body, headers), String.class);
            log.info("[EmailJS] Sent {}", logContext);
        } catch (Exception ex) {
            // Never let an email failure break the actual business operation (order/signup)
            log.error("[EmailJS] Failed to send {}: {}", logContext, ex.getMessage());
        }
    }
}


//package com.henoria.ecommerce.service;
//
//import com.henoria.ecommerce.config.EmailJsProperties;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.HttpEntity;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.HashMap;
//import java.util.Map;
//
///**
// * Sends transactional emails through EmailJS (https://www.emailjs.com) using their
// * REST API, so no SMTP server is needed. This runs server-side (order status changes,
// * signup, etc.), which is different from calling EmailJS from the browser — it requires
// * EmailJS "Private Key" auth (see https://www.emailjs.com/docs/rest-api/send/).
// *
// * If app.emailjs.enabled=false (default until you configure real EmailJS credentials in
// * .env), calls are silently skipped and just logged - the rest of the app keeps working.
// */
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class EmailService {
//
//    private final RestTemplate restTemplate;
//    private final EmailJsProperties props;
//
//    public void sendWelcomeEmail(String toEmail, String toName) {
//        Map<String, Object> params = new HashMap<>();
//        params.put("to_email", toEmail);
//        params.put("to_name", toName);
//        params.put("shop_name", "Henoria");
//        send(props.getTemplates().getWelcome(), params, "welcome email to " + toEmail);
//    }
//
//    public void sendOrderConfirmationEmail(String toEmail, String toName, String orderNumber,
//                                            String itemsSummary, double total, String paymentMethod) {
//        Map<String, Object> params = new HashMap<>();
//        params.put("to_email", toEmail);
//        params.put("to_name", toName);
//        params.put("order_number", orderNumber);
//        params.put("order_items", itemsSummary);
//        params.put("order_total", String.format("%.2f", total));
//        params.put("payment_method", paymentMethod);
//        send(props.getTemplates().getOrderConfirmation(), params, "order confirmation for " + orderNumber);
//    }
//
//    public void sendOrderStatusUpdateEmail(String toEmail, String toName, String orderNumber,
//                                            String newStatus, String note) {
//        Map<String, Object> params = new HashMap<>();
//        params.put("to_email", toEmail);
//        params.put("to_name", toName);
//        params.put("order_number", orderNumber);
//        params.put("order_status", newStatus);
//        params.put("status_note", note == null ? "" : note);
//        send(props.getTemplates().getOrderStatusUpdate(), params, "status update for " + orderNumber);
//    }
//
//    public void sendContactNotification(String fromName, String fromEmail, String phone,
//                                         String subject, String message) {
//        Map<String, Object> params = new HashMap<>();
//        params.put("to_email", props.getAdminEmail());
//        params.put("from_name", fromName);
//        params.put("from_email", fromEmail);
//        params.put("phone", phone == null ? "-" : phone);
//        params.put("subject", subject == null ? "New contact form message" : subject);
//        params.put("message", message);
//        send(props.getTemplates().getContact(), params, "contact form message from " + fromEmail);
//    }
//
//    private void send(String templateId, Map<String, Object> templateParams, String logContext) {
//        if (!props.isEnabled()) {
//            log.info("[EmailJS disabled] Skipped sending {} (set EMAILJS_ENABLED=true in .env to activate)", logContext);
//            return;
//        }
//        if (templateId == null || templateId.isBlank() || props.getServiceId() == null || props.getServiceId().isBlank()) {
//            log.warn("[EmailJS] Missing serviceId/templateId - skipped sending {}", logContext);
//            return;
//        }
//
//        Map<String, Object> body = new HashMap<>();
//        body.put("service_id", props.getServiceId());
//        body.put("template_id", templateId);
//        body.put("user_id", props.getPublicKey());
//        if (props.getPrivateKey() != null && !props.getPrivateKey().isBlank()) {
//            body.put("accessToken", props.getPrivateKey());
//        }
//        body.put("template_params", templateParams);
//
//        try {
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//            restTemplate.postForEntity(props.getApiUrl(), new HttpEntity<>(body, headers), String.class);
//            log.info("[EmailJS] Sent {}", logContext);
//        } catch (Exception ex) {
//            // Never let an email failure break the actual business operation (order/signup)
//            log.error("[EmailJS] Failed to send {}: {}", logContext, ex.getMessage());
//        }
//    }
//}
