package org.example.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class NewsApiClient {

    private static final Logger logger = LoggerFactory.getLogger(NewsApiClient.class);

    @Value("${newsapi.key}")
    private String newsApiKey;

    private final WebClient webClient;
    private final Gson gson;

    public NewsApiClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://newsapi.org/v2").build();
        this.gson = new Gson();
    }

    public List<RawNewsItem> getLatestCryptoNews(int pageSize) {
        try {
            String response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/everything")
                            .queryParam("q", "cryptocurrency OR bitcoin OR ethereum OR crypto market")
                            .queryParam("sortBy", "publishedAt")
                            .queryParam("pageSize", pageSize)
                            .queryParam("language", "en")
                            .queryParam("apiKey", newsApiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseNewsResponse(response);
        } catch (Exception e) {
            logger.error("Error fetching news from News API", e);
            return new ArrayList<>();
        }
    }

    private List<RawNewsItem> parseNewsResponse(String jsonResponse) {
        List<RawNewsItem> items = new ArrayList<>();
        try {
            JsonObject json = gson.fromJson(jsonResponse, JsonObject.class);
            if (json.has("articles")) {
                JsonArray articles = json.getAsJsonArray("articles");
                articles.forEach(article -> {
                    JsonObject art = article.getAsJsonObject();
                    RawNewsItem item = RawNewsItem.builder()
                            .title(art.has("title") ? art.get("title").getAsString() : "")
                            .description(art.has("description") ? art.get("description").getAsString() : "")
                            .url(art.has("url") ? art.get("url").getAsString() : "")
                            .imageUrl(art.has("urlToImage") ? art.get("urlToImage").getAsString() : "")
                            .source(art.has("source") && art.getAsJsonObject("source").has("name") 
                                    ? art.getAsJsonObject("source").get("name").getAsString() : "Unknown")
                            .publishedAt(art.has("publishedAt") ? art.get("publishedAt").getAsString() : "")
                            .build();
                    items.add(item);
                });
            }
        } catch (Exception e) {
            logger.error("Error parsing News API response", e);
        }
        return items;
    }

    public static class RawNewsItem {
        public String title;
        public String description;
        public String url;
        public String imageUrl;
        public String source;
        public String publishedAt;

        public RawNewsItem() {}

        public RawNewsItem(String title, String description, String url, String imageUrl, String source, String publishedAt) {
            this.title = title;
            this.description = description;
            this.url = url;
            this.imageUrl = imageUrl;
            this.source = source;
            this.publishedAt = publishedAt;
        }

        public static RawNewsItemBuilder builder() {
            return new RawNewsItemBuilder();
        }

        public static class RawNewsItemBuilder {
            private String title;
            private String description;
            private String url;
            private String imageUrl;
            private String source;
            private String publishedAt;

            public RawNewsItemBuilder title(String title) {
                this.title = title;
                return this;
            }

            public RawNewsItemBuilder description(String description) {
                this.description = description;
                return this;
            }

            public RawNewsItemBuilder url(String url) {
                this.url = url;
                return this;
            }

            public RawNewsItemBuilder imageUrl(String imageUrl) {
                this.imageUrl = imageUrl;
                return this;
            }

            public RawNewsItemBuilder source(String source) {
                this.source = source;
                return this;
            }

            public RawNewsItemBuilder publishedAt(String publishedAt) {
                this.publishedAt = publishedAt;
                return this;
            }

            public RawNewsItem build() {
                return new RawNewsItem(title, description, url, imageUrl, source, publishedAt);
            }
        }
    }
}
