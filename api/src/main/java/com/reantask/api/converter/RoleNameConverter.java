package com.reantask.api.converter;

import com.reantask.api.enums.RoleName;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores RoleName.ADMIN as "admin" in the database. */
@Converter
public class RoleNameConverter implements AttributeConverter<RoleName, String> {

    @Override
    public String convertToDatabaseColumn(RoleName attribute) {
        return attribute == null ? null : attribute.dbValue();
    }

    @Override
    public RoleName convertToEntityAttribute(String dbData) {
        return dbData == null ? null : RoleName.fromDbValue(dbData);
    }
}
