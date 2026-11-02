package com.example.PawConnect.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            if (!accessor.isMutable()) {
                StompHeaderAccessor mutableAccessor = StompHeaderAccessor.wrap(message);
                authenticateStompConnection(mutableAccessor);
                return MessageBuilder.createMessage(message.getPayload(), mutableAccessor.getMessageHeaders());
            } else {
                authenticateStompConnection(accessor);
            }
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscription(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            authorizeSend(accessor);
        }

        return message;
    }

    private void authenticateStompConnection(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || authHeader.isBlank()) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("STOMP CONNECT rejected: Missing or invalid Authorization header");
            throw new AuthenticationCredentialsNotFoundException("Missing or invalid Authorization header");
        }

        String jwt = authHeader.substring(7).trim();
        if (jwt.isEmpty()) {
            log.warn("STOMP CONNECT rejected: Empty JWT token");
            throw new BadCredentialsException("Empty JWT token");
        }

        try {
            // Strictly reject REFRESH token type
            String tokenType = jwtService.extractTokenType(jwt);
            if (JwtService.TOKEN_TYPE_REFRESH.equals(tokenType)) {
                log.warn("STOMP CONNECT rejected: Refresh token cannot be used for STOMP connection");
                throw new BadCredentialsException("Refresh token cannot be used for STOMP connection");
            }

            String userEmail = jwtService.extractUsername(jwt);
            if (userEmail == null || userEmail.isBlank()) {
                log.warn("STOMP CONNECT rejected: Subject not found in token");
                throw new BadCredentialsException("Subject not found in token");
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
            if (userDetails == null || !userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
                log.warn("STOMP CONNECT rejected: User account inactive or locked for user: {}", userEmail);
                throw new BadCredentialsException("User account inactive or locked");
            }

            Integer currentTokenVersion = null;
            if (userDetails instanceof UserDetailsImpl userDetailsImpl) {
                currentTokenVersion = userDetailsImpl.getUser().getTokenVersion();
            }

            if (!jwtService.isAccessTokenValid(jwt, userDetails, currentTokenVersion)) {
                log.warn("STOMP CONNECT rejected: Token invalid or token version revoked for user: {}", userEmail);
                throw new BadCredentialsException("Invalid or revoked access token");
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );

            accessor.setUser(authentication);
            log.info("STOMP connection authenticated successfully for user: {}", userEmail);

        } catch (AuthenticationCredentialsNotFoundException | BadCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.warn("STOMP CONNECT authentication error: {}", e.getMessage());
            throw new BadCredentialsException("Authentication failed: " + e.getMessage(), e);
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user == null) {
            log.warn("STOMP SUBSCRIBE rejected: Unauthenticated session");
            throw new AccessDeniedException("Unauthenticated STOMP subscription rejected");
        }

        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            log.warn("STOMP SUBSCRIBE rejected: Destination is missing");
            throw new AccessDeniedException("Destination is required for subscription");
        }

        String authenticatedEmail = user.getName();

        // Standard user queue destination for notifications
        if (destination.equals("/user/queue/notifications") || destination.equals("/user/queue/notifications/")) {
            return;
        }

        // Check if destination attempts cross-user subscription explicitly: e.g. /user/other@test.com/queue/notifications
        if (destination.startsWith("/user/")) {
            String suffix = destination.substring("/user/".length());
            if (suffix.contains("/queue/")) {
                String targetPrincipal = suffix.substring(0, suffix.indexOf("/queue/"));
                if (!targetPrincipal.isBlank() && !targetPrincipal.equalsIgnoreCase(authenticatedEmail)) {
                    log.warn("STOMP SUBSCRIBE cross-user subscription rejected: {} attempted to access {}",
                            authenticatedEmail, targetPrincipal);
                    throw new AccessDeniedException("Forbidden: cannot subscribe to another user's private queue");
                }
                return;
            }
        }

        // Server-owned public topics and queues are closed to arbitrary subscriptions
        log.warn("STOMP SUBSCRIBE rejected for unauthorized destination: {} by user: {}", destination, authenticatedEmail);
        throw new AccessDeniedException("Forbidden destination: " + destination);
    }

    private void authorizeSend(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        String username = user != null ? user.getName() : "anonymous";
        String destination = accessor.getDestination();
        log.warn("STOMP SEND rejected: Client-to-server publishing is not permitted. Destination: {} by {}",
                destination, username);
        throw new AccessDeniedException("Client-to-server SEND commands are not permitted");
    }
}
