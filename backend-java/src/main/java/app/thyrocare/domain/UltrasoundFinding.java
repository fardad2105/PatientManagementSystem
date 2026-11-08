package app.thyrocare.domain;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A specific trackable finding described in a neck ultrasound report (location, type, dimensions in mm). */
@Entity
@Table(name = "ultrasound_findings")
@Getter
@Setter
@NoArgsConstructor
public class UltrasoundFinding {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ultrasound_id", nullable = false)
    private NeckUltrasound ultrasound;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private String location;

    private String locationText;
    private String findingType;

    @Column(precision = 6, scale = 1)
    private BigDecimal lengthMm;

    @Column(precision = 6, scale = 1)
    private BigDecimal widthMm;

    @Column(precision = 6, scale = 1)
    private BigDecimal heightMm;

    private String description;
}
