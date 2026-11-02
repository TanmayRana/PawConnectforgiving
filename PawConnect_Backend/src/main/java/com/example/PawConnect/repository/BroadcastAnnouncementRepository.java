package com.example.PawConnect.repository;

import com.example.PawConnect.model.BroadcastAnnouncement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface BroadcastAnnouncementRepository extends JpaRepository<BroadcastAnnouncement, Long>, JpaSpecificationExecutor<BroadcastAnnouncement> {

    Page<BroadcastAnnouncement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<BroadcastAnnouncement> findByTargetAudienceIgnoreCaseOrderByCreatedAtDesc(String targetAudience, Pageable pageable);
}
