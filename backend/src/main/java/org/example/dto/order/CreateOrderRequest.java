package org.example.dto.order;

import lombok.Data;

@Data
public class CreateOrderRequest {
    private String currencyCode;
    private Double amount;
    private Double totalPrice;
} 