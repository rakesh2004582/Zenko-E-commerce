package com.henoria.ecommerce.util;

import java.time.Year;
import java.util.concurrent.ThreadLocalRandom;

public class OrderNumberGenerator {
    public static String generate() {
        int year = Year.now().getValue();
        int random = ThreadLocalRandom.current().nextInt(100000, 999999);
        return "HEN-" + year + "-" + random;
    }
}
