package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.order.AdminOrderDTO;
import org.example.entity.Order;
import org.example.entity.OrderStatus;
import org.example.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final OrderRepository orderRepository;
    private static final List<OrderStatus> ACTIVE_STATUSES = List.of(
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.CONFIRMED,
            OrderStatus.IN_PROGRESS,
            OrderStatus.READY_FOR_PICKUP
    );

    @Transactional(readOnly = true)
    public List<AdminOrderDTO> getAllActiveOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(order -> ACTIVE_STATUSES.contains(order.getStatus()))
                .map(AdminOrderDTO::fromOrder)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markOrderAsCollected(Long orderId) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new RuntimeException("Zamówienie nie znalezione"));
        
        if (order.getStatus() != OrderStatus.PENDING_CONFIRMATION) {
            throw new RuntimeException("Zamówienie musi czekać na potwierdzenie przed oznaczeniem jako odebrane/ukończone");
        }
        
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
    }

    @Transactional
    public AdminOrderDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new RuntimeException("Zamówienie nie znalezione"));
        
        // Walidacja przejścia statusu
        if (order.getStatus() == OrderStatus.COMPLETED && 
            newStatus != OrderStatus.COMPLETED) {
            throw new RuntimeException("Nie można zmienić statusu ukończonego zamówienia");
        }
        
        if (order.getStatus() == OrderStatus.CANCELLED && 
            newStatus != OrderStatus.CANCELLED) {
            throw new RuntimeException("Nie można zmienić statusu anulowanego zamówienia");
        }
        
        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        return AdminOrderDTO.fromOrder(savedOrder);
    }
} 