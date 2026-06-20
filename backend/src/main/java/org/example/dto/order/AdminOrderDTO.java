package org.example.dto.order;

import lombok.Data;
import org.example.entity.Order;
import org.example.entity.OrderStatus;

import java.time.LocalDateTime;

@Data
public class AdminOrderDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String currencyCode;
    private Double amount;
    private Double totalPrice;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminOrderDTO fromOrder(Order order) {
        AdminOrderDTO dto = new AdminOrderDTO();
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
} 