package org.example.service;

import org.example.dto.order.AdminOrderDTO;
import org.example.entity.Order;
import org.example.entity.OrderStatus;
import org.example.security.entity.User;
import org.example.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private AdminService adminService;

    private Order pendingConfirmationOrder;
    private Order pendingPaymentOrder;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");

        pendingConfirmationOrder = new Order();
        pendingConfirmationOrder.setId(1L);
        pendingConfirmationOrder.setUser(user);
        pendingConfirmationOrder.setCurrencyCode("BTC");
        pendingConfirmationOrder.setAmount(0.1);
        pendingConfirmationOrder.setTotalPrice(1000.0);
        pendingConfirmationOrder.setStatus(OrderStatus.PENDING_CONFIRMATION);
        pendingConfirmationOrder.setCreatedAt(LocalDateTime.now());
        pendingConfirmationOrder.setUpdatedAt(LocalDateTime.now());

        pendingPaymentOrder = new Order();
        pendingPaymentOrder.setId(2L);
        pendingPaymentOrder.setUser(user);
        pendingPaymentOrder.setCurrencyCode("ETH");
        pendingPaymentOrder.setAmount(1.0);
        pendingPaymentOrder.setTotalPrice(2500.0);
        pendingPaymentOrder.setStatus(OrderStatus.PENDING_PAYMENT);
        pendingPaymentOrder.setCreatedAt(LocalDateTime.now());
        pendingPaymentOrder.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void getAllActiveOrders_ShouldReturnActiveOrders() {
        // Arrange
        when(orderRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(pendingConfirmationOrder, pendingPaymentOrder));

        // Act
        List<AdminOrderDTO> result = adminService.getAllActiveOrders();

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(dto -> dto.getId().equals(1L)));
        assertTrue(result.stream().anyMatch(dto -> dto.getId().equals(2L)));
        verify(orderRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void markOrderAsCollected_WithPendingConfirmationOrder_ShouldMarkAsCompleted() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(pendingConfirmationOrder));

        // Act
        adminService.markOrderAsCollected(1L);

        // Assert
        assertEquals(OrderStatus.COMPLETED, pendingConfirmationOrder.getStatus());
        verify(orderRepository).save(java.util.Objects.requireNonNull(pendingConfirmationOrder));
    }

    @Test
    void markOrderAsCollected_WithNonPendingConfirmationOrder_ShouldThrowException() {
        // Arrange
        when(orderRepository.findById(2L)).thenReturn(Optional.of(pendingPaymentOrder));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> adminService.markOrderAsCollected(2L));
        verify(orderRepository).findById(2L);
        verifyNoMoreInteractions(orderRepository);
    }

    @Test
    void markOrderAsCollected_WithNonExistentOrder_ShouldThrowException() {
        // Arrange
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> adminService.markOrderAsCollected(999L));
        verify(orderRepository).findById(999L);
        verifyNoMoreInteractions(orderRepository);
    }
} 