package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.order.AdminOrderDTO;
import org.example.entity.OrderStatus;
import org.example.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    private final AdminService adminService;

    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders() {
        try {
            List<AdminOrderDTO> orders = adminService.getAllActiveOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Błąd podczas pobierania zamówień", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Błąd podczas pobierania zamówień: " + e.getMessage()));
        }
    }

    @GetMapping("/active-orders")
    public ResponseEntity<?> getActiveOrders() {
        try {
            logger.info("Pobieranie aktywnych zamówień przez admina");
            List<AdminOrderDTO> orders = adminService.getAllActiveOrders();
            logger.info("Znaleziono {} aktywnych zamówień", orders.size());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Błąd podczas pobierania aktywnych zamówień", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Błąd podczas pobierania aktywnych zamówień: " + e.getMessage()));
        }
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, OrderStatus> request) {
        try {
            OrderStatus newStatus = request.get("newStatus");
            if (newStatus == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Nowy status jest wymagany"));
            }
            
            AdminOrderDTO updatedOrder = adminService.updateOrderStatus(orderId, newStatus);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            logger.error("Błąd podczas aktualizacji statusu zamówienia", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Błąd podczas aktualizacji statusu zamówienia: " + e.getMessage()));
        }
    }

    @PostMapping("/orders/{orderId}/collect")
    public ResponseEntity<?> markOrderAsCollected(@PathVariable Long orderId) {
        try {
            adminService.markOrderAsCollected(orderId);
            return ResponseEntity.ok()
                .body(Map.of("message", "Zamówienie oznaczone jako odebrane"));
        } catch (Exception e) {
            logger.error("Błąd podczas oznaczania zamówienia jako odebrane", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Błąd podczas oznaczania zamówienia jako odebrane: " + e.getMessage()));
        }
    }
}