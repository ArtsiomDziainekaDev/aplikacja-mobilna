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

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserService userService;
    private final CryptoPricingService cryptoPricingService;
    private final CurrencyRateService currencyRateService;

    public OrderDTO createOrder(String userEmail, String currencyCode, Double amount) {
        User user = userService.findByEmail(userEmail);
        
        // Pobieramy kurs waluty przez zewnętrzne API
        double rate;
        try {
            if (isCryptoCurrency(currencyCode)) {
                rate = cryptoPricingService.getSellPrice(currencyCode);
            } else {
                boolean isAdmin = user.getRole().getName() == ERole.ROLE_ADMIN;
                int percentMargin = isAdmin ? 0 : 5;
                rate = currencyRateService.getExternalRate(currencyCode, "PLN", percentMargin);
            }
        } catch (Exception e) {
            rate = isCryptoCurrency(currencyCode)
                ? cryptoPricingService.calculateSellPrice(cryptoPricingService.getDefaultPrice(currencyCode))
                : currencyRateService.getDefaultRate(currencyCode);
        }
        
        Order order = new Order();
        order.setUser(user);
        order.setCurrencyCode(currencyCode);
        order.setAmount(amount);
        
        // Obliczamy całkowitą cenę w PLN (dla krypto już w USD)
        double totalPrice;
        if (isCryptoCurrency(currencyCode)) {
            totalPrice = amount * rate;
            try {
                totalPrice = totalPrice * currencyRateService.getExternalRate("USD", "PLN", 0);
            } catch (Exception e) {
                totalPrice = totalPrice * currencyRateService.getDefaultRate("USD");
            }
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
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new RuntimeException("Zamówienie nie znalezione"));
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(Objects.requireNonNull(id));
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