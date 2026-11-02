package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.PetResponse;
import com.example.PawConnect.model.Pet;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;

@Component
public class PetMapper {

    public PetResponse toResponse(Pet pet) {
        if (pet == null) {
            return null;
        }

        String ownerName = null;
        Long ownerId = null;
        if (pet.getOwner() != null) {
            ownerId = pet.getOwner().getId();
            String firstName = pet.getOwner().getFirstName() != null ? pet.getOwner().getFirstName() : "";
            String lastName = pet.getOwner().getLastName() != null ? pet.getOwner().getLastName() : "";
            ownerName = (firstName + " " + lastName).trim();
        }

        return PetResponse.builder()
                .id(pet.getId())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .name(pet.getName())
                .species(pet.getSpecies())
                .breed(pet.getBreed())
                .dateOfBirth(pet.getDateOfBirth())
                .age(calculateAge(pet.getDateOfBirth()))
                .gender(pet.getGender())
                .weight(pet.getWeight())
                .photoUrl(pet.getPhotoUrl())
                .notes(pet.getNotes())
                .microchipNumber(pet.getMicrochipNumber())
                .microchipId(pet.getMicrochipNumber())
                .status(pet.getStatus())
                .createdAt(pet.getCreatedAt())
                .updatedAt(pet.getUpdatedAt())
                .build();
    }

    public String calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return null;
        }
        LocalDate today = LocalDate.now();
        if (dateOfBirth.isAfter(today)) {
            return "0 days";
        }
        Period period = Period.between(dateOfBirth, today);
        int years = period.getYears();
        int months = period.getMonths();
        int days = period.getDays();

        if (years > 0) {
            StringBuilder sb = new StringBuilder();
            sb.append(years).append(years == 1 ? " year" : " years");
            if (months > 0) {
                sb.append(" ").append(months).append(months == 1 ? " month" : " months");
            }
            return sb.toString();
        } else if (months > 0) {
            StringBuilder sb = new StringBuilder();
            sb.append(months).append(months == 1 ? " month" : " months");
            if (days > 0) {
                sb.append(" ").append(days).append(days == 1 ? " day" : " days");
            }
            return sb.toString();
        } else {
            return days + (days == 1 ? " day" : " days");
        }
    }
}
