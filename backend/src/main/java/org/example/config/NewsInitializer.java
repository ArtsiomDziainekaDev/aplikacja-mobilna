package org.example.config;

import lombok.RequiredArgsConstructor;
import org.example.service.NewsService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NewsInitializer {

    private final NewsService newsService;

    @EventListener(ApplicationReadyEvent.class)
    public void warmNewsCache() {
        newsService.refreshNewsAsync();
    }
}
