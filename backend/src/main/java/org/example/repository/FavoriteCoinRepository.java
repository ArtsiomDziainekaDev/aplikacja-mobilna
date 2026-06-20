package org.example.repository;

import org.example.entity.FavoriteCoin;
import org.example.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteCoinRepository extends JpaRepository<FavoriteCoin, Long> {
    List<FavoriteCoin> findByUser(User user);
    void deleteByUserAndSymbol(User user, String symbol);
    boolean existsByUserAndSymbol(User user, String symbol);
}
