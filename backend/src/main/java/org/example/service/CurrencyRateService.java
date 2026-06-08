package org.example.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CurrencyRateService {
    private static final Logger logger = LoggerFactory.getLogger(CurrencyRateService.class);

    @Value("${currencyfreaks.apikey}")
    private String currencyFreaksApiKey;

    private final RestTemplate restTemplate;

    public double getExternalRate(String base, String target, double percent) throws Exception {
        if (base.equals(target)) {
            return 1.0 * (1 + percent / 100.0);
        }

        String url = String.format(
            "https://api.currencyfreaks.com/v2.0/rates/latest?apikey=%s&base=USD",
            currencyFreaksApiKey
        );

        String response = restTemplate.getForObject(Objects.requireNonNull(url), String.class);
        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(Objects.requireNonNull(response));

        if (!node.has("rates")) {
            throw new IllegalStateException("CurrencyFreaks response does not contain rates");
        }

        JsonNode rates = node.get("rates");
        double result;

        if ("USD".equals(base) && rates.has(target)) {
            result = rates.get(target).asDouble();
        } else if ("USD".equals(target) && rates.has(base)) {
            result = 1.0 / rates.get(base).asDouble();
        } else if (rates.has(base) && rates.has(target)) {
            double usdToBase = rates.get(base).asDouble();
            double usdToTarget = rates.get(target).asDouble();
            result = usdToTarget / usdToBase;
        } else {
            throw new IllegalStateException("Currency pair not found: " + base + " -> " + target);
        }

        result = result * (1 + percent / 100.0);
        logger.debug("Rate {} -> {} with {}% margin: {}", base, target, percent, result);
        return result;
    }

    public double getDefaultRate(String currencyCode) {
        return switch (currencyCode) {
            case "PLN" -> 1.0;
            case "USD" -> 3.75;
            case "EUR" -> 4.05;
            case "GBP" -> 4.75;
            default -> 4.0;
        };
    }

    public double getFallbackRate(String base, String target, double percent) {
        if (base.equals(target)) {
            return 1.0 * (1 + percent / 100.0);
        }

        double baseToPln = getDefaultRate(base);
        double targetToPln = getDefaultRate(target);
        return (baseToPln / targetToPln) * (1 + percent / 100.0);
    }
}
