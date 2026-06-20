package org.example.dto;

import org.example.dto.order.AdminOrderDTO;
import org.example.entity.Order;
import org.example.entity.OrderStatus;
import org.example.security.entity.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class AdminOrderDTOTest {

    @Test
    void fromOrder_WithConfirmedOrder_ShouldMapCorrectly() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");

        Order order = new Order();
        order.setId(1L);
        order.setUser(user);
        order.setCurrencyCode("BTC");
        order.setAmount(0.1);
        order.setTotalPrice(1000.0);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        // Act
        AdminOrderDTO dto = AdminOrderDTO.fromOrder(order);

        // Assert
        assertEquals(1L, dto.getId());
        assertEquals(1L, dto.getUserId());
        assertEquals("test@example.com", dto.getUserEmail());
        assertEquals("BTC", dto.getCurrencyCode());
        assertEquals(0.1, dto.getAmount());
        assertEquals(1000.0, dto.getTotalPrice());
        assertEquals(OrderStatus.CONFIRMED, dto.getStatus());
        assertNotNull(dto.getCreatedAt());
        assertNotNull(dto.getUpdatedAt());
    }

    @Test
    void fromOrder_WithCompletedOrder_ShouldMapCorrectly() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");

        Order order = new Order();
        order.setId(1L);
        order.setUser(user);
        order.setCurrencyCode("ETH");
        order.setAmount(1.0);
        order.setTotalPrice(2500.0);
        order.setStatus(OrderStatus.COMPLETED);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        // Act
        AdminOrderDTO dto = AdminOrderDTO.fromOrder(order);

        // Assert
        assertEquals(1L, dto.getId());
        assertEquals("test@example.com", dto.getUserEmail());
        assertEquals(OrderStatus.COMPLETED, dto.getStatus());
    }

    @Test
    void fromOrder_WithPendingPaymentOrder_ShouldMapCorrectly() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");

        Order order = new Order();
        order.setId(1L);
        order.setUser(user);
        order.setCurrencyCode("BTC");
        order.setAmount(0.5);
        order.setTotalPrice(5000.0);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        // Act
        AdminOrderDTO dto = AdminOrderDTO.fromOrder(order);

        // Assert
        assertEquals(1L, dto.getId());
        assertEquals("test@example.com", dto.getUserEmail());
        assertEquals(OrderStatus.PENDING_PAYMENT, dto.getStatus());
    }
} 