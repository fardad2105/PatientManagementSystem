package app.thyrocare.domain;

import java.util.Set;

/** Follow-up lab tests for DTC and the units each one may be recorded in. */
public enum LabTestType {
    TSH(Set.of("mIU/L", "µIU/mL")),
    FT4(Set.of("ng/dL", "pmol/L")),
    TG(Set.of("ng/mL", "µg/L")),
    ANTI_TG(Set.of("IU/mL", "kIU/L"));

    private final Set<String> units;

    LabTestType(Set<String> units) {
        this.units = units;
    }

    public boolean allowsUnit(String unit) {
        return units.contains(unit);
    }
}
