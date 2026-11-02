package com.example.PawConnect.config;

import com.example.PawConnect.security.StompChannelInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompChannelInterceptor stompChannelInterceptor;

    @Value("${application.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    public WebSocketConfig(StompChannelInterceptor stompChannelInterceptor) {
        this.stompChannelInterceptor = stompChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(origin -> origin.trim())
                .toArray(String[]::new);

        // Register /ws endpoint with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins)
                .withSockJS();

        // Register raw WebSocket endpoint /ws
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory simple broker for point-to-point queues and broadcast topics
        registry.enableSimpleBroker("/queue", "/topic");

        // Prefix used by Spring to identify user-specific destinations
        registry.setUserDestinationPrefix("/user");

        // Prefix for incoming messages routed to @MessageMapping handlers
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Enforce STOMP CONNECT JWT authentication and destination authorization
        registration.interceptors(stompChannelInterceptor);
    }
}
