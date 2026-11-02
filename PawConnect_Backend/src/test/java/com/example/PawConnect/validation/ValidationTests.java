package com.example.PawConnect.validation;

import com.example.PawConnect.dto.request.admin.AdminCreateServiceProviderRequest;
import com.example.PawConnect.dto.request.admin.ProductRequest;
import com.example.PawConnect.dto.request.auth.LoginRequest;
import com.example.PawConnect.dto.request.auth.RegisterRequest;
import com.example.PawConnect.dto.request.professional.UpdateAvailabilityRequest;
import com.example.PawConnect.dto.request.address.CreateAddressRequest;
import com.example.PawConnect.model.AddressType;
import com.example.PawConnect.model.ProductStatus;
import com.example.PawConnect.model.ProviderType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testInvalidEmailFailsValidation() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("not-a-valid-email")
                .password("SecurePass123!")
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Invalid email format must produce validation violations");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testBlankRequiredFieldFailsValidation() {
        LoginRequest request = LoginRequest.builder()
                .email("")
                .password("somePassword")
                .build();

        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Blank email must produce validation violations");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testWeakPasswordFailsValidation() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@pawconnect.com")
                .password("simple") // Too short and missing required pattern
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Weak password must produce validation violations");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    void testNegativePriceFailsValidation() {
        ProductRequest request = ProductRequest.builder()
                .categoryId(1L)
                .name("Cat Food")
                .sku("SKU-CAT-01")
                .price(new BigDecimal("-10.00")) // Negative price
                .stockQuantity(50)
                .status(ProductStatus.ACTIVE)
                .build();

        Set<ConstraintViolation<ProductRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Negative price must produce validation violations");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("price")));
    }

    @Test
    void testNegativeStockFailsValidation() {
        ProductRequest request = ProductRequest.builder()
                .categoryId(1L)
                .name("Dog Food")
                .sku("SKU-DOG-01")
                .price(new BigDecimal("15.00"))
                .stockQuantity(-5) // Negative stock
                .status(ProductStatus.ACTIVE)
                .build();

        Set<ConstraintViolation<ProductRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Negative stock must produce validation violations");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("stockQuantity")));
    }

    @Test
    void testInvalidAvailabilityWindowFailsValidation() {
        UpdateAvailabilityRequest request = UpdateAvailabilityRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(15, 0))
                .endTime(LocalTime.of(10, 0)) // End time before start time
                .slotDurationMinutes(30)
                .build();

        Set<ConstraintViolation<UpdateAvailabilityRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "End time earlier than start time must fail cross-field validation");
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("End time must be after start time")));
    }

    @Test
    void testValidRegisterRequestPassesValidation() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@pawconnect.com")
                .phone("+12345678901")
                .password("StrongPass1@")
                .confirmPassword("StrongPass1@")
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid register request must pass validation without violations");
    }

    @Test
    void testAddressCoordinatesOutsideRangeFailsValidation() {
        CreateAddressRequest invalidLatRequest = CreateAddressRequest.builder()
                .addressType(AddressType.HOME)
                .recipientName("John Doe")
                .addressLine1("123 Main Street")
                .city("San Francisco")
                .state("CA")
                .postalCode("94102")
                .country("USA")
                .phone("+1234567890")
                .latitude(new BigDecimal("95.1234567")) // Invalid: > 90
                .longitude(new BigDecimal("190.5000000")) // Invalid: > 180
                .build();

        Set<ConstraintViolation<CreateAddressRequest>> violations = validator.validate(invalidLatRequest);
        assertFalse(violations.isEmpty(), "Coordinates outside valid ranges (-90..90, -180..180) must fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("latitude")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("longitude")));
    }

    @Test
    void testValidAddressCoordinatesPassValidation() {
        CreateAddressRequest validRequest = CreateAddressRequest.builder()
                .addressType(AddressType.HOME)
                .recipientName("John Doe")
                .addressLine1("123 Main Street")
                .city("San Francisco")
                .state("CA")
                .postalCode("94102")
                .country("USA")
                .phone("+1234567890")
                .latitude(new BigDecimal("37.7749295"))
                .longitude(new BigDecimal("-122.4194155"))
                .build();

        Set<ConstraintViolation<CreateAddressRequest>> violations = validator.validate(validRequest);
        assertTrue(violations.isEmpty(), "Valid coordinates within bounds must pass validation without violations");
    }

    @Test
    void testServiceProviderCoordinatesValidation() {
        AdminCreateServiceProviderRequest invalidRequest = AdminCreateServiceProviderRequest.builder()
                .firstName("Liam")
                .lastName("Vance")
                .email("liam@poshpaws.com")
                .businessName("Posh Paws")
                .businessPhone("+14155558900")
                .providerType(ProviderType.GROOMER)
                .latitude(new BigDecimal("-95.5")) // Invalid: < -90
                .longitude(new BigDecimal("210.0")) // Invalid: > 180
                .build();

        Set<ConstraintViolation<AdminCreateServiceProviderRequest>> violations = validator.validate(invalidRequest);
        assertFalse(violations.isEmpty(), "Invalid coordinates must fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("latitude")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("longitude")));
    }
}
