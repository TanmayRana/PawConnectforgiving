package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.response.InvoiceResponse;
import com.example.PawConnect.dto.response.InvoiceResponse.InvoiceLineItem;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.AppointmentRepository;
import com.example.PawConnect.repository.OrderItemRepository;
import com.example.PawConnect.repository.OrderRepository;
import com.example.PawConnect.repository.PaymentRepository;
import com.example.PawConnect.repository.ServiceBookingRepository;
import com.example.PawConnect.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceServiceImpl implements InvoiceService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final PaymentRepository paymentRepository;

    private static final String DEFAULT_GSTIN = "19AABCP1234C1Z5";
    private static final String FC_ADDRESS = "PawConnect Central Fulfillment Center, Salt Lake Sector V, Kolkata, West Bengal - 700091, India";
    private static final String SUPPORT_PHONE = "+91-33-4000-1234";
    private static final String SUPPORT_EMAIL = "billing@pawconnect.com";

    @Override
    public InvoiceResponse getOrderInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getPaymentStatus() != PaymentStatus.PAID &&
            order.getPaymentStatus() != PaymentStatus.SUCCESS &&
            order.getPaymentStatus() != PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException("Tax Invoice is only issued for paid transactions. Current order payment status is: " + order.getPaymentStatus());
        }

        Payment payment = paymentRepository
                .findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor.ORDER, orderId)
                .orElse(null);

        String invoiceNumber = order.getInvoiceNumber() != null && !order.getInvoiceNumber().isBlank()
                ? order.getInvoiceNumber()
                : "INV-ORD-" + order.getId();

        LocalDateTime invoiceDate = order.getPlacedAt() != null
                ? order.getPlacedAt()
                : (order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now());

        String customerName = order.getUser() != null ? order.getUser().getFullName() : "Customer";
        String customerPhone = order.getUser() != null ? order.getUser().getPhone() : "";
        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : "";

        String billingAddress = order.getAddress() != null
                ? formatAddress(order.getAddress())
                : FC_ADDRESS;

        String shippingAddress = billingAddress;
        if (order.getDeliveryRecipientName() != null) {
            shippingAddress = order.getDeliveryRecipientName() + ", " +
                    (order.getDeliveryAddressLine1() != null ? order.getDeliveryAddressLine1() + ", " : "") +
                    (order.getDeliveryAddressLine2() != null ? order.getDeliveryAddressLine2() + ", " : "") +
                    (order.getDeliveryCity() != null ? order.getDeliveryCity() + ", " : "") +
                    (order.getDeliveryState() != null ? order.getDeliveryState() + " - " : "") +
                    (order.getDeliveryPostalCode() != null ? order.getDeliveryPostalCode() : "");
        }

        BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : total;
        BigDecimal discount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;

        BigDecimal taxable = total.subtract(shippingFee).max(BigDecimal.ZERO)
                .divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal gstTotal = total.subtract(shippingFee).subtract(taxable).max(BigDecimal.ZERO);
        BigDecimal cgst = gstTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = gstTotal.subtract(cgst);

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        List<InvoiceLineItem> lineItems = new ArrayList<>();
        int sNo = 1;
        if (orderItems != null && !orderItems.isEmpty()) {
            for (OrderItem it : orderItems) {
                BigDecimal lineTot = it.getLineTotal() != null ? it.getLineTotal() : BigDecimal.ZERO;
                BigDecimal itemTaxable = lineTot.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
                BigDecimal itemGst = lineTot.subtract(itemTaxable);
                BigDecimal itemCgst = itemGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                BigDecimal itemSgst = itemGst.subtract(itemCgst);

                String prodName = it.getProductName() != null ? it.getProductName() :
                        (it.getProduct() != null ? it.getProduct().getName() : "Pet Product");

                lineItems.add(InvoiceLineItem.builder()
                        .serialNo(sNo++)
                        .description(prodName)
                        .hsnSacCode("2309")
                        .quantity(it.getQuantity())
                        .unitPrice(it.getUnitPrice())
                        .taxableValue(itemTaxable)
                        .cgstAmount(itemCgst)
                        .sgstAmount(itemSgst)
                        .lineTotal(lineTot)
                        .build());
            }
        } else {
            lineItems.add(InvoiceLineItem.builder()
                    .serialNo(1)
                    .description("PawConnect Curated Pet Supplies")
                    .hsnSacCode("2309")
                    .quantity(1)
                    .unitPrice(taxable)
                    .taxableValue(taxable)
                    .cgstAmount(cgst)
                    .sgstAmount(sgst)
                    .lineTotal(total)
                    .build());
        }

        String paymentStatus = order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PAID";
        if (payment != null && payment.getStatus() != null) {
            paymentStatus = payment.getStatus().name();
        }

        return InvoiceResponse.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceDate(invoiceDate)
                .invoiceType("ORDER")
                .resourceId(order.getId())
                .referenceNumber(order.getOrderNo())
                .issuerName("PawConnect Retail India Pvt. Ltd.")
                .issuerSubHeader("PawConnect Central Fulfillment Depot")
                .issuerAddress(FC_ADDRESS)
                .issuerGstin(DEFAULT_GSTIN)
                .issuerPhone(SUPPORT_PHONE)
                .issuerEmail(SUPPORT_EMAIL)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .billingAddress(billingAddress)
                .shippingAddress(shippingAddress)
                .courierPartner(order.getCourierPartner())
                .awbNumber(order.getTrackingNumber())
                .paymentStatus(paymentStatus)
                .paymentMethod(payment != null && payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "Razorpay Online")
                .razorpayOrderId(payment != null ? payment.getGatewayOrderId() : null)
                .razorpayPaymentId(payment != null ? payment.getGatewayPaymentId() : null)
                .paidAt(payment != null ? payment.getCreatedAt() : invoiceDate)
                .subtotal(subtotal)
                .discountAmount(discount)
                .shippingFee(shippingFee)
                .taxableAmount(taxable)
                .cgstRate(BigDecimal.valueOf(9.00))
                .cgstAmount(cgst)
                .sgstRate(BigDecimal.valueOf(9.00))
                .sgstAmount(sgst)
                .totalAmount(total)
                .grandTotal(total)
                .hsnSacCode("2309")
                .amountInWords(convertToWords(total))
                .items(lineItems)
                .build();
    }

    @Override
    public InvoiceResponse getAppointmentInvoice(Long appointmentId) {
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        Payment payment = apt.getPayment() != null ? apt.getPayment() :
                paymentRepository.findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor.APPOINTMENT, appointmentId).orElse(null);

        String invoiceNumber = "INV-VET-" + apt.getId() + "-" + (apt.getAppointmentNo() != null ? apt.getAppointmentNo().replace("APT-", "") : apt.getId());
        LocalDateTime invoiceDate = apt.getCreatedAt() != null ? apt.getCreatedAt() : LocalDateTime.now();

        User petOwner = apt.getPet() != null && apt.getPet().getOwner() != null ? apt.getPet().getOwner() : null;
        String customerName = petOwner != null ? petOwner.getFullName() : "Pet Parent";
        String customerPhone = petOwner != null ? petOwner.getPhone() : "";
        String customerEmail = petOwner != null ? petOwner.getEmail() : "";

        Veterinarian vet = apt.getVeterinarian();
        String issuerName = "PawConnect Veterinary Clinical Network";
        String issuerSubHeader = vet != null ? "Dr. " + (vet.getUser() != null ? vet.getUser().getFullName() : "Specialist") + " (" + (vet.getClinicName() != null ? vet.getClinicName() : "PawConnect Clinic") + ")" : "PawConnect Vet Care";
        String issuerAddress = vet != null && vet.getClinicAddress() != null ? vet.getClinicAddress() : FC_ADDRESS;

        BigDecimal fee = apt.getConsultationFee() != null ? apt.getConsultationFee() : BigDecimal.valueOf(500.00);
        BigDecimal taxable = fee.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal gstTotal = fee.subtract(taxable);
        BigDecimal cgst = gstTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = gstTotal.subtract(cgst);

        List<InvoiceLineItem> lineItems = List.of(
                InvoiceLineItem.builder()
                        .serialNo(1)
                        .description("Clinical Consultation & Veterinary Examination (" + (apt.getReason() != null ? apt.getReason() : "General Checkup") + ")")
                        .hsnSacCode("9983")
                        .quantity(1)
                        .unitPrice(taxable)
                        .taxableValue(taxable)
                        .cgstAmount(cgst)
                        .sgstAmount(sgst)
                        .lineTotal(fee)
                        .build()
        );

        String paymentStatus = payment != null && payment.getStatus() != null ? payment.getStatus().name() : "PAID";

        return InvoiceResponse.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceDate(invoiceDate)
                .invoiceType("APPOINTMENT")
                .resourceId(apt.getId())
                .referenceNumber(apt.getAppointmentNo())
                .issuerName(issuerName)
                .issuerSubHeader(issuerSubHeader)
                .issuerAddress(issuerAddress)
                .issuerGstin(DEFAULT_GSTIN)
                .issuerPhone(SUPPORT_PHONE)
                .issuerEmail(SUPPORT_EMAIL)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .billingAddress("Registered Pet Parent Address, India")
                .petName(apt.getPet() != null ? apt.getPet().getName() : "Pet")
                .petSpecies(apt.getPet() != null ? apt.getPet().getSpecies() : "Canine")
                .petBreed(apt.getPet() != null ? apt.getPet().getBreed() : "")
                .scheduledDate(apt.getAppointmentDate() != null ? apt.getAppointmentDate().toString() : "")
                .scheduledTimeSlot(apt.getStartTime() != null ? apt.getStartTime().toString() + " - " + apt.getEndTime() : "")
                .paymentStatus(paymentStatus)
                .paymentMethod(payment != null && payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "Razorpay Online")
                .razorpayOrderId(payment != null ? payment.getGatewayOrderId() : null)
                .razorpayPaymentId(payment != null ? payment.getGatewayPaymentId() : null)
                .paidAt(payment != null ? payment.getCreatedAt() : invoiceDate)
                .subtotal(taxable)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .taxableAmount(taxable)
                .cgstRate(BigDecimal.valueOf(9.00))
                .cgstAmount(cgst)
                .sgstRate(BigDecimal.valueOf(9.00))
                .sgstAmount(sgst)
                .totalAmount(fee)
                .grandTotal(fee)
                .hsnSacCode("998351")
                .amountInWords(convertToWords(fee))
                .items(lineItems)
                .build();
    }

    @Override
    public InvoiceResponse getServiceBookingInvoice(Long bookingId) {
        ServiceBooking booking = serviceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Service booking not found with id: " + bookingId));

        Payment payment = booking.getPayment() != null ? booking.getPayment() :
                paymentRepository.findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor.SERVICE_BOOKING, bookingId).orElse(null);

        String invoiceNumber = "INV-SRV-" + booking.getId() + "-" + (booking.getBookingNo() != null ? booking.getBookingNo().replace("SB-", "") : booking.getId());
        LocalDateTime invoiceDate = booking.getCreatedAt() != null ? booking.getCreatedAt() : LocalDateTime.now();

        User petOwner = booking.getPet() != null && booking.getPet().getOwner() != null ? booking.getPet().getOwner() : null;
        String customerName = petOwner != null ? petOwner.getFullName() : "Pet Parent";
        String customerPhone = petOwner != null ? petOwner.getPhone() : "";
        String customerEmail = petOwner != null ? petOwner.getEmail() : "";

        ServiceProvider provider = booking.getProvider();
        String issuerName = "PawConnect Professional Services Network";
        String issuerSubHeader = provider != null ? (provider.getBusinessName() != null ? provider.getBusinessName() : "Certified Pet Care") : "PawConnect Grooming & Training";
        String issuerAddress = provider != null && provider.getAddress() != null ? provider.getAddress() : FC_ADDRESS;

        BigDecimal price = booking.getPrice() != null ? booking.getPrice() : BigDecimal.valueOf(800.00);
        BigDecimal taxable = price.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal gstTotal = price.subtract(taxable);
        BigDecimal cgst = gstTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = gstTotal.subtract(cgst);

        String serviceName = booking.getService() != null ? booking.getService().getName() : "Pet Care Service";

        List<InvoiceLineItem> lineItems = List.of(
                InvoiceLineItem.builder()
                        .serialNo(1)
                        .description(serviceName + " (Professional Pet Care Session)")
                        .hsnSacCode("9997")
                        .quantity(1)
                        .unitPrice(taxable)
                        .taxableValue(taxable)
                        .cgstAmount(cgst)
                        .sgstAmount(sgst)
                        .lineTotal(price)
                        .build()
        );

        String paymentStatus = payment != null && payment.getStatus() != null ? payment.getStatus().name() : "PAID";

        return InvoiceResponse.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceDate(invoiceDate)
                .invoiceType("SERVICE_BOOKING")
                .resourceId(booking.getId())
                .referenceNumber(booking.getBookingNo())
                .issuerName(issuerName)
                .issuerSubHeader(issuerSubHeader)
                .issuerAddress(issuerAddress)
                .issuerGstin(DEFAULT_GSTIN)
                .issuerPhone(SUPPORT_PHONE)
                .issuerEmail(SUPPORT_EMAIL)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .customerEmail(customerEmail)
                .billingAddress("Registered Pet Parent Address, India")
                .petName(booking.getPet() != null ? booking.getPet().getName() : "Pet")
                .petSpecies(booking.getPet() != null ? booking.getPet().getSpecies() : "Canine")
                .petBreed(booking.getPet() != null ? booking.getPet().getBreed() : "")
                .scheduledDate(booking.getBookingDate() != null ? booking.getBookingDate().toString() : "")
                .scheduledTimeSlot(booking.getStartTime() != null ? booking.getStartTime().toString() + " - " + booking.getEndTime() : "")
                .paymentStatus(paymentStatus)
                .paymentMethod(payment != null && payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "Razorpay Online")
                .razorpayOrderId(payment != null ? payment.getGatewayOrderId() : null)
                .razorpayPaymentId(payment != null ? payment.getGatewayPaymentId() : null)
                .paidAt(payment != null ? payment.getCreatedAt() : invoiceDate)
                .subtotal(taxable)
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .taxableAmount(taxable)
                .cgstRate(BigDecimal.valueOf(9.00))
                .cgstAmount(cgst)
                .sgstRate(BigDecimal.valueOf(9.00))
                .sgstAmount(sgst)
                .totalAmount(price)
                .grandTotal(price)
                .hsnSacCode("999722")
                .amountInWords(convertToWords(price))
                .items(lineItems)
                .build();
    }

    @Override
    public InvoiceResponse getPaymentInvoice(String identifier) {
        Payment payment = null;
        try {
            Long numericId = Long.parseLong(identifier);
            payment = paymentRepository.findById(numericId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (payment == null) {
            payment = paymentRepository.findByPaymentReference(identifier)
                    .or(() -> paymentRepository.findByGatewayPaymentId(identifier))
                    .or(() -> paymentRepository.findByGatewayOrderId(identifier))
                    .orElseThrow(() -> new ResourceNotFoundException("Payment not found for identifier: " + identifier));
        }

        if (payment.getPaymentFor() == PaymentFor.ORDER) {
            return getOrderInvoice(payment.getReferenceId());
        } else if (payment.getPaymentFor() == PaymentFor.APPOINTMENT) {
            return getAppointmentInvoice(payment.getReferenceId());
        } else if (payment.getPaymentFor() == PaymentFor.SERVICE_BOOKING) {
            return getServiceBookingInvoice(payment.getReferenceId());
        }

        throw new ResourceNotFoundException("Unknown payment classification: " + payment.getPaymentFor());
    }

    private String formatAddress(Address addr) {
        StringBuilder sb = new StringBuilder();
        if (addr.getRecipientName() != null) sb.append(addr.getRecipientName()).append(", ");
        if (addr.getAddressLine1() != null) sb.append(addr.getAddressLine1()).append(", ");
        if (addr.getAddressLine2() != null) sb.append(addr.getAddressLine2()).append(", ");
        if (addr.getCity() != null) sb.append(addr.getCity()).append(", ");
        if (addr.getState() != null) sb.append(addr.getState()).append(" - ");
        if (addr.getPostalCode() != null) sb.append(addr.getPostalCode());
        return sb.toString();
    }

    private String convertToWords(BigDecimal amount) {
        if (amount == null) return "Zero Rupees Only";
        long rupees = amount.longValue();
        int paise = amount.remainder(BigDecimal.ONE).multiply(BigDecimal.valueOf(100)).intValue();

        String words = convertNumberToWords(rupees) + " Rupees";
        if (paise > 0) {
            words += " and " + convertNumberToWords(paise) + " Paise";
        }
        return words + " Only";
    }

    private static final String[] UNITS = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private String convertNumberToWords(long n) {
        if (n == 0) return "Zero";
        if (n < 0) return "Minus " + convertNumberToWords(-n);

        if (n < 20) return UNITS[(int) n];
        if (n < 100) return TENS[(int) n / 10] + ((n % 10 != 0) ? " " + UNITS[(int) n % 10] : "");
        if (n < 1000) return UNITS[(int) n / 100] + " Hundred" + ((n % 100 != 0) ? " " + convertNumberToWords(n % 100) : "");
        if (n < 100000) return convertNumberToWords(n / 1000) + " Thousand" + ((n % 1000 != 0) ? " " + convertNumberToWords(n % 1000) : "");
        if (n < 10000000) return convertNumberToWords(n / 100000) + " Lakh" + ((n % 100000 != 0) ? " " + convertNumberToWords(n % 100000) : "");
        return convertNumberToWords(n / 10000000) + " Crore" + ((n % 10000000 != 0) ? " " + convertNumberToWords(n % 10000000) : "");
    }
}
