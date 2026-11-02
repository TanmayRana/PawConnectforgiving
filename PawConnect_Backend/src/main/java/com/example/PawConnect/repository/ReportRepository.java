package com.example.PawConnect.repository;

import com.example.PawConnect.model.Report;
import com.example.PawConnect.model.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {
    List<Report> findByReportedById(Long reportedById);
    Page<Report> findByReportedById(Long reportedById, Pageable pageable);
    List<Report> findByAssignedToId(Long assignedToId);
    Page<Report> findByAssignedToId(Long assignedToId, Pageable pageable);
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
    long countByStatusIn(List<ReportStatus> statuses);
}
