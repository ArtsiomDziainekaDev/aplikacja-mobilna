package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.example.entity.FavoriteCoin;
import org.example.repository.FavoriteCoinRepository;
import org.example.service.UserService;
import org.example.security.entity.User;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/crypto")
@RequiredArgsConstructor
public class CryptoController {
    private static final Logger logger = LoggerFactory.getLogger(CryptoController.class);
    
    @Value("${crypto.sell.discount.percent}")
    private double sellDiscountPercent;

    private final FavoriteCoinRepository favoriteCoinRepository;
    private final UserService userService;

    // List of supported cryptocurrencies for trading
    private static final List<CryptoInfo> SUPPORTED_CRYPTOS = List.of(
        new CryptoInfo("bitcoin", "BTC", "Bitcoin"),
        new CryptoInfo("ethereum", "ETH", "Ethereum"),
        new CryptoInfo("binancecoin", "BNB", "Binance Coin"),
        new CryptoInfo("cardano", "ADA", "Cardano"),
        new CryptoInfo("solana", "SOL", "Solana"),
        new CryptoInfo("polkadot", "DOT", "Polkadot"),
        new CryptoInfo("chainlink", "LINK", "Chainlink"),
        new CryptoInfo("litecoin", "LTC", "Litecoin"),
        new CryptoInfo("ripple", "XRP", "Ripple"),
        new CryptoInfo("dogecoin", "DOGE", "Dogecoin"),
        new CryptoInfo("avalanche-2", "AVAX", "Avalanche"),
        new CryptoInfo("matic-network", "MATIC", "Polygon"),
        new CryptoInfo("uniswap", "UNI", "Uniswap"),
        new CryptoInfo("cosmos", "ATOM", "Cosmos"),
        new CryptoInfo("filecoin", "FIL", "Filecoin")
    );

    @GetMapping
    public ResponseEntity<List<CryptoResponse>> getAllCryptos() {
        logger.info("Fetching cryptocurrency prices from Binance API (24hr ticker)");
        List<CryptoResponse> cryptos = new ArrayList<>();
        
        try {
            String url = "https://api.binance.com/api/v3/ticker/24hr?symbols=[\"BTCUSDT\",\"ETHUSDT\",\"BNBUSDT\",\"ADAUSDT\",\"SOLUSDT\",\"DOTUSDT\",\"LINKUSDT\",\"LTCUSDT\",\"XRPUSDT\",\"DOGEUSDT\",\"AVAXUSDT\",\"MATICUSDT\",\"UNIUSDT\",\"ATOMUSDT\",\"FILUSDT\"]";
            
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            logger.debug("Binance response: {}", response.getBody());
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());
            
            if (!root.isArray()) {
                logger.error("Binance response is not an array");
                return getStaticCryptos();
            }
            
            for (CryptoInfo cryptoInfo : SUPPORTED_CRYPTOS) {
                String binanceSymbol = cryptoInfo.getSymbol() + "USDT";
                CryptoResponse crypto = findCryptoInBinanceResponse(root, cryptoInfo, binanceSymbol);
                if (crypto != null) {
                    cryptos.add(crypto);
                } else {
                    logger.warn("Could not find {} in API response, using static data", cryptoInfo.getSymbol());
                    cryptos.add(new CryptoResponse(
                        cryptoInfo.getId(),
                        cryptoInfo.getSymbol(),
                        cryptoInfo.getName(),
                        getDefaultPrice(cryptoInfo.getSymbol()),
                        calculateSellPrice(getDefaultPrice(cryptoInfo.getSymbol())),
                        0.0,
                        0.0
                    ));
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching from Binance: {}", e.getMessage());
            return getStaticCryptos();
        }
        
        logger.info("Returning {} cryptocurrencies", cryptos.size());
        return ResponseEntity.ok().header("X-Data-Source", "live").body(cryptos);
    }

    @GetMapping("/{symbol}/price")
    public ResponseEntity<CryptoPriceResponse> getCryptoPrice(@PathVariable String symbol) {
        logger.info("Fetching 24hr ticker for cryptocurrency: {}", symbol);
        
        try {
            String url = "https://api.binance.com/api/v3/ticker/24hr?symbol=" + symbol.toUpperCase() + "USDT";
            
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());
            
            if (!root.has("lastPrice")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            
            double marketPrice = root.get("lastPrice").asDouble();
            double sellPrice = calculateSellPrice(marketPrice);
            double priceChangePercent24h = root.has("priceChangePercent") ? root.get("priceChangePercent").asDouble() : 0.0;
            
            CryptoPriceResponse priceResponse = new CryptoPriceResponse(
                symbol.toUpperCase(),
                marketPrice,
                sellPrice,
                sellDiscountPercent,
                priceChangePercent24h
            );
            
            return ResponseEntity.ok(priceResponse);
        } catch (Exception e) {
            logger.error("Error fetching cryptocurrency price: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(null);
        }
    }

    private CryptoResponse findCryptoInBinanceResponse(JsonNode data, CryptoInfo cryptoInfo, String binanceSymbol) {
        for (JsonNode item : data) {
            if (item.has("symbol") && binanceSymbol.equalsIgnoreCase(item.get("symbol").asText())) {
                try {
                    double marketPrice = item.get("lastPrice").asDouble();
                    double sellPrice = calculateSellPrice(marketPrice);
                    double priceChangePercent24h = item.has("priceChangePercent") ? item.get("priceChangePercent").asDouble() : 0.0;
                    double volume24h = item.has("quoteVolume") ? item.get("quoteVolume").asDouble() : 0.0;
                    
                    return new CryptoResponse(
                        cryptoInfo.getId(),
                        cryptoInfo.getSymbol(),
                        cryptoInfo.getName(),
                        marketPrice,
                        sellPrice,
                        priceChangePercent24h,
                        volume24h
                    );
                } catch (Exception e) {
                    logger.warn("Error parsing crypto data for {}: {}", cryptoInfo.getSymbol(), e.getMessage());
                    return null;
                }
            }
        }
        return null;
    }

    private double calculateSellPrice(double marketPrice) {
        return marketPrice * (1 - sellDiscountPercent / 100.0);
    }

    private ResponseEntity<List<CryptoResponse>> getStaticCryptos() {
        logger.warn("Using static cryptocurrency data as fallback");
        List<CryptoResponse> cryptos = new ArrayList<>();
        for (CryptoInfo cryptoInfo : SUPPORTED_CRYPTOS) {
            double marketPrice = getDefaultPrice(cryptoInfo.getSymbol());
            cryptos.add(new CryptoResponse(
                cryptoInfo.getId(),
                cryptoInfo.getSymbol(),
                cryptoInfo.getName(),
                marketPrice,
                calculateSellPrice(marketPrice),
                0.0,
                0.0
            ));
        }
        // Mark the payload as fallback so clients can avoid presenting static
        // prices as live market data.
        return ResponseEntity.ok().header("X-Data-Source", "fallback").body(cryptos);
    }
    
    private double getDefaultPrice(String symbol) {
        switch (symbol) {
            case "BTC": return 43000.0;
            case "ETH": return 2600.0;
            case "BNB": return 310.0;
            case "ADA": return 0.48;
            case "SOL": return 105.0;
            case "DOT": return 7.2;
            case "LINK": return 14.5;
            case "LTC": return 73.0;
            case "XRP": return 0.62;
            case "DOGE": return 0.12;
            case "AVAX": return 30.0;
            case "MATIC": return 0.85;
            case "UNI": return 6.5;
            case "ATOM": return 8.2;
            case "FIL": return 5.5;
            default: return 100.0;
        }
    }

    @GetMapping("/favorites")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> getFavoriteCoins(Authentication authentication) {
        User user = userService.findByEmail(authentication.getName());
        List<String> favorites = favoriteCoinRepository.findByUser(user).stream()
                .map(FavoriteCoin::getSymbol)
                .collect(Collectors.toList());
        return ResponseEntity.ok(favorites);
    }

    @PostMapping("/favorites/{symbol}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addFavoriteCoin(Authentication authentication, @PathVariable String symbol) {
        User user = userService.findByEmail(authentication.getName());
        
        if (favoriteCoinRepository.findByUser(user).size() >= 3) {
            return ResponseEntity.badRequest().body("You can only have up to 3 favorite coins.");
        }
        
        if (!favoriteCoinRepository.existsByUserAndSymbol(user, symbol)) {
            FavoriteCoin favoriteCoin = new FavoriteCoin();
            favoriteCoin.setUser(user);
            favoriteCoin.setSymbol(symbol);
            favoriteCoinRepository.save(favoriteCoin);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/favorites/{symbol}")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> removeFavoriteCoin(Authentication authentication, @PathVariable String symbol) {
        User user = userService.findByEmail(authentication.getName());
        favoriteCoinRepository.deleteByUserAndSymbol(user, symbol);
        return ResponseEntity.ok().build();
    }

    // DTO Classes
    static class CryptoInfo {
        private String id;
        private String symbol;
        private String name;

        public CryptoInfo(String id, String symbol, String name) {
            this.id = id;
            this.symbol = symbol;
            this.name = name;
        }

        public String getId() { return id; }
        public String getSymbol() { return symbol; }
        public String getName() { return name; }
    }

    static class CryptoResponse {
        private String id;
        private String symbol;
        private String name;
        private double marketPrice;
        private double sellPrice;
        private double priceChangePercent24h;
        private double volume24h;

        public CryptoResponse(String id, String symbol, String name, double marketPrice, double sellPrice, double priceChangePercent24h, double volume24h) {
            this.id = id;
            this.symbol = symbol;
            this.name = name;
            this.marketPrice = marketPrice;
            this.sellPrice = sellPrice;
            this.priceChangePercent24h = priceChangePercent24h;
            this.volume24h = volume24h;
        }

        public String getId() { return id; }
        public String getSymbol() { return symbol; }
        public String getName() { return name; }
        public double getMarketPrice() { return marketPrice; }
        public double getSellPrice() { return sellPrice; }
        public double getPriceChangePercent24h() { return priceChangePercent24h; }
        public double getVolume24h() { return volume24h; }
    }

    static class CryptoPriceResponse {
        private String symbol;
        private double marketPrice;
        private double sellPrice;
        private double discountPercent;
        private double priceChangePercent24h;

        public CryptoPriceResponse(String symbol, double marketPrice, double sellPrice, double discountPercent, double priceChangePercent24h) {
            this.symbol = symbol;
            this.marketPrice = marketPrice;
            this.sellPrice = sellPrice;
            this.discountPercent = discountPercent;
            this.priceChangePercent24h = priceChangePercent24h;
        }

        public String getSymbol() { return symbol; }
        public double getMarketPrice() { return marketPrice; }
        public double getSellPrice() { return sellPrice; }
        public double getDiscountPercent() { return discountPercent; }
        public double getPriceChangePercent24h() { return priceChangePercent24h; }
    }
} 