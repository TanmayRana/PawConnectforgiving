package com.example.PawConnect.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pet_medical_records", indexes = {
    @Index(name = "idx_medical_records_pet_id", columnList = "pet_id"),
    @Index(name = "idx_medical_records_vet_id", columnList = "veterinarian_id"),
    @Index(name = "idx_medical_records_date", columnList = "record_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"pet", "veterinarian"})
@EntityListeners(AuditingEntityListener.class)
public class PetMedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "veterinarian_id")
    private Veterinarian veterinarian;

    @Column(name = "record_type", length = 100, nullable = false)
    private String recordType;

    @Column(name = "diagnosis", columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "treatment", columnDefinition = "TEXT")
    private String treatment;

    @Column(name = "medicines", columnDefinition = "TEXT")
    private String medicines;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
