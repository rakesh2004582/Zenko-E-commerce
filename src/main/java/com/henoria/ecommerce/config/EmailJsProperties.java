package com.henoria.ecommerce.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.emailjs")
@Data
public class EmailJsProperties {
    private boolean enabled;
    private String apiUrl;
    private String serviceId;
    private String publicKey;
    private String privateKey;
    private String adminEmail;
    private Templates templates = new Templates();

    @Data
    public static class Templates {
        private String welcome;
        private String orderConfirmation;
        private String orderStatusUpdate;
        private String contact;
        private String passwordReset;
    }
}
