package com.example.PawConnect.security;

import com.example.PawConnect.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    public static final String TOKEN_TYPE_ACCESS = "ACCESS";
    public static final String TOKEN_TYPE_REFRESH = "REFRESH";
    public static final String CLAIM_TOKEN_TYPE = "token_type";
    public static final String CLAIM_TOKEN_VERSION = "token_version";
    public static final String CLAIM_USER_ID = "user_id";
    public static final String CLAIM_ROLES = "roles";

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;
    
    @Value("${application.security.jwt.expiration:900000}")
    private long jwtExpiration;

    @Value("${application.security.jwt.refresh-token.expiration:604800000}")
    private long refreshExpiration;

    public long getJwtExpiration() {
        return jwtExpiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public String extractUsername(String token) {
        return extractClaim(token, claims -> claims.getSubject());
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String extractTokenType(String token) {
        try {
            return extractClaim(token, claims -> claims.get(CLAIM_TOKEN_TYPE, String.class));
        } catch (Exception e) {
            return null;
        }
    }

    public Integer extractTokenVersion(String token) {
        try {
            return extractClaim(token, claims -> claims.get(CLAIM_TOKEN_VERSION, Integer.class));
        } catch (Exception e) {
            return null;
        }
    }

    public Long extractUserId(String token) {
        try {
            return extractClaim(token, claims -> {
                Object val = claims.get(CLAIM_USER_ID);
                if (val instanceof Number n) {
                    return n.longValue();
                }
                return null;
            });
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        try {
            return extractClaim(token, claims -> claims.get(CLAIM_ROLES, List.class));
        } catch (Exception e) {
            return null;
        }
    }

    public String generateAccessToken(User user, List<String> roles) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS);
        claims.put(CLAIM_TOKEN_VERSION, user.getTokenVersion());
        claims.put(CLAIM_USER_ID, user.getId());
        claims.put(CLAIM_ROLES, roles);

        return buildToken(claims, user.getEmail(), jwtExpiration);
    }

    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_REFRESH);
        claims.put(CLAIM_TOKEN_VERSION, user.getTokenVersion());
        claims.put(CLAIM_USER_ID, user.getId());

        return buildToken(claims, user.getEmail(), refreshExpiration);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>(extraClaims);
        if (!claims.containsKey(CLAIM_TOKEN_TYPE)) {
            claims.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS);
        }
        return buildToken(claims, userDetails.getUsername(), jwtExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username != null && username.equals(userDetails.getUsername())) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isAccessTokenValid(String token, UserDetails userDetails, Integer currentTokenVersion) {
        try {
            final String username = extractUsername(token);
            if (username == null || !username.equals(userDetails.getUsername()) || isTokenExpired(token)) {
                return false;
            }
            String tokenType = extractTokenType(token);
            if (tokenType != null && !TOKEN_TYPE_ACCESS.equals(tokenType)) {
                return false;
            }
            Integer versionInToken = extractTokenVersion(token);
            if (versionInToken != null && currentTokenVersion != null && !versionInToken.equals(currentTokenVersion)) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshTokenValid(String token, String expectedEmail, Integer currentTokenVersion) {
        try {
            final String username = extractUsername(token);
            if (username == null || !username.equalsIgnoreCase(expectedEmail) || isTokenExpired(token)) {
                return false;
            }
            String tokenType = extractTokenType(token);
            if (!TOKEN_TYPE_REFRESH.equals(tokenType)) {
                return false;
            }
            Integer versionInToken = extractTokenVersion(token);
            if (versionInToken != null && currentTokenVersion != null && !versionInToken.equals(currentTokenVersion)) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, claims -> claims.getExpiration());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey);
        } catch (Exception base64Ex) {
            try {
                keyBytes = Decoders.BASE64URL.decode(secretKey);
            } catch (Exception base64UrlEx) {
                keyBytes = secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
