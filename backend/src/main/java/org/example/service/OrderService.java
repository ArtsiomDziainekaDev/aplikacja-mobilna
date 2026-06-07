package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.order.OrderDTO;
import org.example.dto.order.AdminOrderDTO;
import org.example.entity.Order;
import org.example.entity.OrderStatus;
import org.example.repository.OrderRepository;
import org.example.security.entity.User;
import org.example.security.entity.ERole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserService userService;
    private final RestTemplate restTemplate;

    public OrderDTO createOrder(String userEmail, String currencyCode, Double amount) {
        User user = userService.findByEmail(userEmail);
        
        // Pobieramy kurs waluty przez zewnętrzne API
        double rate;
        try {
            // Sprawdzamy, czy to kryptowaluta
            if (isCryptoCurrency(currencyCode)) {
                // Dla kryptowalut używamy crypto API
                String url = String.format("http://localhost:8081/api/crypto/%s/price", currencyCode);
                String response = restTemplate.getForObject(url, String.class);
                ObjectMapper mapper = new ObjectMapper();
                JsonNode node = mapper.readTree(response);
                rate = node.get("sellPrice").asDouble(); // Używamy ceny sprzedaży z już zastosowaną zniżką
            } else {
                // Dla zwykłych walut używamy currencies API. Zastosuj 5% marżę dla zwykłych użytkowników.
                boolean isAdmin = user.getRole().getName() == ERole.ROLE_ADMIN;
                int percentMargin = isAdmin ? 0 : 5;
                String url = String.format("http://localhost:8081/api/currencies/external-rate?base=%s&target=PLN&percent=%d", currencyCode, percentMargin);
                Double apiRate = restTemplate.getForObject(url, Double.class);
                rate = apiRate != null ? apiRate : 1.0;
            }
        } catch (Exception e) {
            // Jeśli API niedostępne, używamy podstawowych kursów (krypto w USD, fiat do PLN)
            rate = isCryptoCurrency(currencyCode)
                ? getDefaultCryptoPriceUsd(currencyCode)
                : getDefaultRate(currencyCode);
        }
        
        Order order = new Order();
        order.setUser(user);
        order.setCurrencyCode(currencyCode);
        order.setAmount(amount);
        
        // Obliczamy całkowitą cenę w PLN (dla krypto już w USD)
        double totalPrice;
        if (isCryptoCurrency(currencyCode)) {
            totalPrice = amount * rate; // Dla krypto rate już w USD, trzeba przeliczyć na PLN
            // Przeliczamy USD na PLN (przybliżony kurs 3.75)
            totalPrice = totalPrice * 3.75;
        } else if ("PLN".equals(currencyCode)) {
            totalPrice = amount;
        } else {
            totalPrice = amount * rate;
        }
        
        order.setTotalPrice(totalPrice);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    private double getDefaultRate(String currencyCode) {
        switch (currencyCode) {
            // Regular currencies (to PLN)
            case "USD": return 3.75;
            case "EUR": return 4.05;
            case "GBP": return 4.75;
            default: return 4.0;
        }
    }

    // Zapasowe ceny krypto w USD, gdy Binance jest niedostępny.
    // Wartości spójne z CryptoController.getDefaultPrice, żeby zamówienie nie dostało absurdalnej ceny.
    private double getDefaultCryptoPriceUsd(String currencyCode) {
        switch (currencyCode) {
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

    // Lista wspieranych kryptowalut — musi być spójna z CryptoController.SUPPORTED_CRYPTOS.
    private static final List<String> SUPPORTED_CRYPTO_SYMBOLS = List.of(
        "BTC", "ETH", "BNB", "ADA", "SOL", "DOT", "LINK", "LTC",
        "XRP", "DOGE", "AVAX", "MATIC", "UNI", "ATOM", "FIL"
    );

    private boolean isCryptoCurrency(String currencyCode) {
        return SUPPORTED_CRYPTO_SYMBOLS.contains(currencyCode);
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getUserOrders(String userEmail) {
        User user = userService.findByEmail(userEmail);
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminOrderDTO> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream()
                .map(this::convertToAdminDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Zamówienie nie znalezione"));
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setUserId(order.getUser().getId());
        dto.setUserEmail(order.getUser().getEmail());
        dto.setCurrencyCode(order.getCurrencyCode());
        dto.setAmount(order.getAmount());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        return dto;
    }

    private AdminOrderDTO convertToAdminDTO(Order order) {
        return AdminOrderDTO.fromOrder(order);
    }
} 