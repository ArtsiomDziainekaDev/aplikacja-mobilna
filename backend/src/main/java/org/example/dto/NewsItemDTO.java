package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsItemDTO {
    private String id;
    private String title;
    private String summary;
    private String source;
    private String url;
    private String imageUrl;
    private LocalDateTime publishedAt;
    private List<String> tags;
}