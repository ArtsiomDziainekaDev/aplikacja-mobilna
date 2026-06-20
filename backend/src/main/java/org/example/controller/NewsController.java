package org.example.controller;

import org.example.dto.NewsItemDTO;
import org.example.service.NewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping
    public ResponseEntity<List<NewsItemDTO>> getLatestNews() {
        List<NewsItemDTO> news = newsService.getLatestNews();
        return ResponseEntity.ok(news);
    }

    @PostMapping("/refresh")
    public ResponseEntity<String> refreshNews() {
        newsService.refreshNews();
        return ResponseEntity.ok("News refresh initiated");
    }
}
