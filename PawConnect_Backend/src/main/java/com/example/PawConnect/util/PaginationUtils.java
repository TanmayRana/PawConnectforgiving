package com.example.PawConnect.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

public final class PaginationUtils {

    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private PaginationUtils() {}

    public static Pageable createPageRequest(int page, int size, String sort, Set<String> allowedSortFields, String defaultSortField) {
        int validatedPage = Math.max(page, 0);
        int validatedSize = (size <= 0) ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);

        Sort validatedSort = Sort.by(Sort.Direction.DESC, defaultSortField);
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            if (allowedSortFields.contains(field)) {
                Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;
                validatedSort = Sort.by(direction, field);
            }
        }
        return PageRequest.of(validatedPage, validatedSize, validatedSort);
    }
}
