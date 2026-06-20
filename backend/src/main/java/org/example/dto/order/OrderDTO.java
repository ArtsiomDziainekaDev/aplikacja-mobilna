package org.example.dto.order;

import lombok.Data;
import org.example.entity.OrderStatus;

import java.time.LocalDateTime;

@Data
public class OrderDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String currencyCode;
    private Double amount;
    private Double totalPrice;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 