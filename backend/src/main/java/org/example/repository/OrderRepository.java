package org.example.repository;

import org.example.entity.Order;
import org.example.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o JOIN FETCH o.user u JOIN FETCH u.role")
    List<Order> findAllWithUserRoles();

    List<Order> findByUserId(Long userId);
} 