package org.example.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class CryptoPricingService {
    private static final Logger logger = LoggerFactory.getLogger(CryptoPricingService.class);

    @Value("${crypto.sell.discount.percent}")
    private double sellDiscountPercent;

    private final RestTemplate restTemplate;

    public double getSellPrice(String symbol) {
        try {
            String url = "https://api.binance.com/api/v3/ticker/24hr?symbol=" + symbol.toUpperCase() + "USDT";
            String response = restTemplate.getForObject(url, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            if (!root.has("lastPrice")) {
                throw new IllegalStateException("Missing lastPrice for " + symbol);
            }
            return calculateSellPrice(root.get("lastPrice").asDouble());
        } catch (Exception e) {
            logger.warn("Using default sell price for {}: {}", symbol, e.getMessage());
            return calculateSellPrice(getDefaultPrice(symbol));
        }
    }

    public double calculateSellPrice(double marketPrice) {
        return marketPrice * (1 - sellDiscountPercent / 100.0);
    }

    public double getDefaultPrice(String symbol) {
        return switch (symbol) {
            case "BTC" -> 43000.0;
            case "ETH" -> 2600.0;
            case "BNB" -> 310.0;
            case "ADA" -> 0.48;
            case "SOL" -> 105.0;
            case "DOT" -> 7.2;
            case "LINK" -> 14.5;
            case "LTC" -> 73.0;
            case "XRP" -> 0.62;
            case "DOGE" -> 0.12;
            case "AVAX" -> 30.0;
            case "MATIC" -> 0.85;
            case "UNI" -> 6.5;
            case "ATOM" -> 8.2;
            case "FIL" -> 5.5;
            default -> 100.0;
        };
    }
}
