package org.example.controller;

import org.example.dto.order.AdminOrderDTO;
import org.example.entity.OrderStatus;
import org.example.service.AdminService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    @Test
    void getActiveOrders_ShouldReturnOrders() {
        // Arrange
        List<AdminOrderDTO> expectedOrders = List.of(
            createTestOrderDTO(1L, "user1@example.com", OrderStatus.CONFIRMED),
            createTestOrderDTO(2L, "user2@example.com", OrderStatus.PENDING_PAYMENT)
        );
        when(adminService.getAllActiveOrders()).thenReturn(expectedOrders);

        // Act
        ResponseEntity<?> response = adminController.getActiveOrders();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody(), "Response body should not be null");
        verify(adminService).getAllActiveOrders();
    }

    @Test
    void markOrderAsCollected_ShouldReturnOk() {
        // Arrange
        Long orderId = 1L;
        doNothing().when(adminService).markOrderAsCollected(orderId);

        // Act
        ResponseEntity<?> response = adminController.markOrderAsCollected(orderId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(adminService).markOrderAsCollected(orderId);
    }

    private AdminOrderDTO createTestOrderDTO(Long id, String userEmail, OrderStatus status) {
        AdminOrderDTO dto = new AdminOrderDTO();
        dto.setId(id);
        dto.setUserId(1L);
        dto.setUserEmail(userEmail);
        dto.setCurrencyCode("BTC");
        dto.setAmount(0.1);
        dto.setTotalPrice(1000.0);
        dto.setStatus(status);
        dto.setCreatedAt(LocalDateTime.now());
        dto.setUpdatedAt(LocalDateTime.now());
        return dto;
    }
} 