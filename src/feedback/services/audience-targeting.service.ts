import { Injectable } from '@nestjs/common';
import { AudienceTargetType } from '../enums';

export interface AudienceConfig {
  targetType: AudienceTargetType;
  employeeIds?: string[];
  companyIds?: string[];
  departmentIds?: string[];
  orgUnitIds?: string[];
  employmentTypes?: string[];
  locationIds?: string[];
}

/**
 * Service to resolve audience targeting into a list of employee IDs.
 * This service would integrate with the employee/company services
 * to resolve dynamic targeting criteria.
 */
@Injectable()
export class AudienceTargetingService {
  /**
   * Resolves audience configuration to a list of employee IDs.
   * For now, this is a simplified implementation.
   * In production, this would query employee data based on targeting criteria.
   */
  async resolveEmployeeIds(
    companyId: string,
    config: AudienceConfig,
  ): Promise<string[]> {
    switch (config.targetType) {
      case AudienceTargetType.ALL_EMPLOYEES:
        // In a real implementation, query all active employees for the company
        return config.employeeIds || [];

      case AudienceTargetType.SPECIFIC_EMPLOYEES:
        return config.employeeIds || [];

      case AudienceTargetType.DEPARTMENT:
        // In a real implementation, query employees by department
        return config.employeeIds || [];

      case AudienceTargetType.ORG_UNIT:
        // In a real implementation, query employees by org unit
        return config.employeeIds || [];

      case AudienceTargetType.EMPLOYMENT_TYPE:
        // In a real implementation, query employees by employment type
        return config.employeeIds || [];

      case AudienceTargetType.LOCATION:
        // In a real implementation, query employees by location
        return config.employeeIds || [];

      default:
        return config.employeeIds || [];
    }
  }

  /**
   * Validates audience configuration.
   */
  validateConfig(config: AudienceConfig): { valid: boolean; error?: string } {
    if (!config.targetType) {
      return { valid: false, error: 'Target type is required' };
    }

    switch (config.targetType) {
      case AudienceTargetType.SPECIFIC_EMPLOYEES:
        if (!config.employeeIds?.length) {
          return { valid: false, error: 'At least one employee must be selected' };
        }
        break;

      case AudienceTargetType.DEPARTMENT:
        if (!config.departmentIds?.length) {
          return { valid: false, error: 'At least one department must be selected' };
        }
        break;

      case AudienceTargetType.ORG_UNIT:
        if (!config.orgUnitIds?.length) {
          return { valid: false, error: 'At least one org unit must be selected' };
        }
        break;

      case AudienceTargetType.EMPLOYMENT_TYPE:
        if (!config.employmentTypes?.length) {
          return { valid: false, error: 'At least one employment type must be selected' };
        }
        break;

      case AudienceTargetType.LOCATION:
        if (!config.locationIds?.length) {
          return { valid: false, error: 'At least one location must be selected' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Describes the audience in human-readable format.
   */
  describeAudience(config: AudienceConfig): string {
    switch (config.targetType) {
      case AudienceTargetType.ALL_EMPLOYEES:
        return 'All employees';

      case AudienceTargetType.SPECIFIC_EMPLOYEES:
        const count = config.employeeIds?.length || 0;
        return `${count} selected employee${count !== 1 ? 's' : ''}`;

      case AudienceTargetType.DEPARTMENT:
        return `${config.departmentIds?.length || 0} department(s)`;

      case AudienceTargetType.ORG_UNIT:
        return `${config.orgUnitIds?.length || 0} org unit(s)`;

      case AudienceTargetType.EMPLOYMENT_TYPE:
        return `${config.employmentTypes?.length || 0} employment type(s)`;

      case AudienceTargetType.LOCATION:
        return `${config.locationIds?.length || 0} location(s)`;

      default:
        return 'Unknown audience';
    }
  }
}
