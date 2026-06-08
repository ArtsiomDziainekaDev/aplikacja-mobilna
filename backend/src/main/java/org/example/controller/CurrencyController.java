package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.service.CurrencyRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/currencies")
@RequiredArgsConstructor
public class CurrencyController {
    private static final Logger logger = LoggerFactory.getLogger(CurrencyController.class);

    private final CurrencyRateService currencyRateService;

    @Value("${currencyfreaks.apikey}")
    private String currencyFreaksApiKey;

    // Statyczna lista obsługiwanych walut
    private static final List<CurrencyInfo> SUPPORTED_CURRENCIES = List.of(
        new CurrencyInfo(1L, "USD", "Dolar amerykański", "PLN"),
        new CurrencyInfo(2L, "EUR", "Euro", "PLN"),
        new CurrencyInfo(3L, "GBP", "Funt brytyjski", "PLN")
    );

    @GetMapping
    public ResponseEntity<List<CurrencyResponse>> getAllCurrencies() {
        logger.info("Pobieranie walut z zewnętrznego API");
        List<CurrencyResponse> currencies = new ArrayList<>();
        
        try {
            // Pobieramy wszystkie kursy od USD
            String url = String.format(
                "https://api.currencyfreaks.com/v2.0/rates/latest?apikey=%s&base=USD",
                currencyFreaksApiKey
            );
            
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(Objects.requireNonNull(url), String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(Objects.requireNonNull(response));
            
            if (!node.has("rates")) {
                logger.error("Odpowiedź CurrencyFreaks nie zawiera kursów");
                // Zastępstwo kursami statycznymi
                return getStaticCurrencies();
            }
            
            JsonNode rates = node.get("rates");
            double usdToPln = rates.has("PLN") ? rates.get("PLN").asDouble() : 3.75;
            
            for (CurrencyInfo currencyInfo : SUPPORTED_CURRENCIES) {
                double rate;
                if ("USD".equals(currencyInfo.getCode())) {
                    rate = usdToPln; // USD -> PLN bezpośrednio
                } else {
                    // Dla EUR, GBP: pobieramy USD->EUR, potem obliczamy EUR->PLN
                    if (rates.has(currencyInfo.getCode())) {
                        double usdToTarget = rates.get(currencyInfo.getCode()).asDouble();
                        rate = usdToPln / usdToTarget; // EUR/PLN = (USD/PLN) / (USD/EUR)
                    } else {
                        rate = getDefaultRate(currencyInfo.getCode());
                    }
                }
                
                currencies.add(new CurrencyResponse(
                    currencyInfo.getId(),
                    currencyInfo.getCode(),
                    currencyInfo.getName(),
                    rate,
                    currencyInfo.getBaseCode()
                ));
            }
        } catch (Exception e) {
            logger.error("Błąd podczas pobierania z CurrencyFreaks: {}", e.getMessage());
            return getStaticCurrencies();
        }
        
        logger.info("Zwracanie {} walut", currencies.size());
        return ResponseEntity.ok(currencies);
    }
    
    private ResponseEntity<List<CurrencyResponse>> getStaticCurrencies() {
        List<CurrencyResponse> currencies = new ArrayList<>();
        for (CurrencyInfo currencyInfo : SUPPORTED_CURRENCIES) {
            currencies.add(new CurrencyResponse(
                currencyInfo.getId(),
                currencyInfo.getCode(),
                currencyInfo.getName(),
                getDefaultRate(currencyInfo.getCode()),
                currencyInfo.getBaseCode()
            ));
        }
        return ResponseEntity.ok(currencies);
    }
    
    private double getDefaultRate(String currencyCode) {
        switch (currencyCode) {
            case "USD": return 3.75;
            case "EUR": return 4.05;
            case "GBP": return 4.75;
            default: return 4.0;
        }
    }

    @GetMapping("/rate")
    public ResponseEntity<Double> getExternalRate(
            @RequestParam String base,
            @RequestParam String target,
            @RequestParam(defaultValue = "0") double percent
    ) {
        logger.info("Pobieranie kursu zewnętrznego: {} do {} z marżą {}%", base, target, percent);
        
        try {
            double rate = currencyRateService.getExternalRate(base, target, percent);
            return ResponseEntity.ok(rate);
        } catch (Exception e) {
            double fallbackRate = currencyRateService.getFallbackRate(base, target, percent);
            logger.warn(
                "Błąd podczas pobierania kursu zewnętrznego, używam kursu lokalnego dla {} -> {}: {}",
                base,
                target,
                e.getMessage()
            );
            return ResponseEntity.ok(fallbackRate);
        }
    }

    @GetMapping("/external-rate")
    public ResponseEntity<Double> getExternalRateAlias(
            @RequestParam String base,
            @RequestParam String target,
            @RequestParam(defaultValue = "0") double percent
    ) {
        return getExternalRate(base, target, percent);
    }

    // Klasy DTO
    static class CurrencyInfo {
        private Long id;
        private String code;
        private String name;
        private String baseCode;

        public CurrencyInfo(Long id, String code, String name, String baseCode) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.baseCode = baseCode;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
        public String getBaseCode() { return baseCode; }
    }

    static class CurrencyResponse {
        private Long id;
        private String code;
        private String name;
        private double rate;
        private String baseCode;

        public CurrencyResponse(Long id, String code, String name, double rate, String baseCode) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.rate = rate;
            this.baseCode = baseCode;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
        public double getRate() { return rate; }
        public String getBaseCode() { return baseCode; }
    }
} 