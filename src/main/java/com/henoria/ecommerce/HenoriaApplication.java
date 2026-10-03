package com.henoria.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HenoriaApplication {
    public static void main(String[] args) {
        SpringApplication.run(HenoriaApplication.class, args);
    }
}