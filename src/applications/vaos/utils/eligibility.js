import * as Sentry from '@sentry/browser';
import { PRIMARY_CARE, DISABLED_LIMIT_VALUE } from '../utils/constants';
import { captureError } from '../utils/error';

import {
  checkPastVisits,
  getRequestLimits,
  getPacTeam,
  getAvailableClinics,
} from '../api';

import { recordVaosError } from './events';

function createErrorHandler(directOrRequest, errorKey) {
  return data => {
    captureError(data);
    recordVaosError(errorKey);
    return { [`${directOrRequest}Failed`]: true };
  };
}

/*
 * This makes all the service calls needed to determine if a Veteran
 * is eligible for direct scheduling or requests. The getEligibilityChecks
 * function below takes the raw data from here and determines if the 
 * check passes or fails.
 *
 * Any errors in the promises for each service are caught so that
 * Promise.all doesn't abort and we can figure out if we can see if
 * we made it through either all the request related checks or all the 
 * direct related requests
 */
export async function getEligibilityData(
  facility,
  typeOfCareId,
  systemId,
  isDirectScheduleEnabled,
) {
  const facilityId = facility.institutionCode;
  const eligibilityChecks = [
    checkPastVisits(systemId, facilityId, typeOfCareId, 'request').catch(
      createErrorHandler('request', 'request-check-past-visits-error'),
    ),
    getRequestLimits(facilityId, typeOfCareId).catch(
      createErrorHandler(
        'request',
        'request-exceeded-outstanding-requests-error',
      ),
    ),
  ];

  if (facility.directSchedulingSupported && isDirectScheduleEnabled) {
    eligibilityChecks.push(
      checkPastVisits(systemId, facilityId, typeOfCareId, 'direct').catch(
        createErrorHandler('direct', 'direct-check-past-visits-error'),
      ),
    );
    eligibilityChecks.push(
      getAvailableClinics(facilityId, typeOfCareId, systemId).catch(
        createErrorHandler('direct', 'direct-available-clinics-error'),
      ),
    );

    if (typeOfCareId === PRIMARY_CARE) {
      eligibilityChecks.push(
        getPacTeam(systemId).catch(
          createErrorHandler('direct', 'direct-pac-team-error'),
        ),
      );
    }
  }

  const [requestPastVisit, requestLimits, ...directData] = await Promise.all(
    eligibilityChecks,
  );
  let eligibility = {
    requestPastVisit,
    requestLimits,
    directSupported: facility.directSchedulingSupported,
    requestSupported: facility.requestSupported,
  };

  if (directData?.length) {
    const [directPastVisit, clinics, ...pacTeam] = directData;
    eligibility = {
      ...eligibility,
      directPastVisit,
      clinics,
    };

    if (pacTeam.length) {
      eligibility = {
        ...eligibility,
        pacTeam: pacTeam[0],
      };
    }
  }

  return eligibility;
}

function hasVisitedInPastMonthsDirect(eligibilityData) {
  return (
    eligibilityData.directPastVisit.durationInMonths === DISABLED_LIMIT_VALUE ||
    eligibilityData.directPastVisit.hasVisitedInPastMonths
  );
}

function hasVisitedInPastMonthsRequest(eligibilityData) {
  return (
    eligibilityData.requestPastVisit?.durationInMonths ===
      DISABLED_LIMIT_VALUE ||
    eligibilityData.requestPastVisit?.hasVisitedInPastMonths
  );
}

function hasPACTeamIfPrimaryCare(eligibilityData, typeOfCareId, systemId) {
  return (
    typeOfCareId !== PRIMARY_CARE ||
    eligibilityData.pacTeam.some(provider => provider.facilityId === systemId)
  );
}

function isUnderRequestLimit(eligibilityData) {
  return (
    eligibilityData.requestLimits?.requestLimit === DISABLED_LIMIT_VALUE ||
    eligibilityData.requestLimits?.numberOfRequests <
      eligibilityData.requestLimits?.requestLimit
  );
}

function isDirectSchedulingEnabled(eligibilityData) {
  return typeof eligibilityData.directPastVisit !== 'undefined';
}

function hasRequestFailed(eligibilityData) {
  return Object.values(eligibilityData).some(result => result?.requestFailed);
}

function hasDirectFailed(eligibilityData) {
  return Object.values(eligibilityData).some(result => result?.directFailed);
}

/*
 * This function takes the data from the eligibility related services and 
 * decides if each check we need to make passes or fails. It also checks for
 * errors in either of the two "blocks" of checks (requests or direct). If 
 * one block of checks is successful, we can still let a user continue on that,
 * even if another path is blocked.
*/
export function getEligibilityChecks(systemId, typeOfCareId, eligibilityData) {
  // If we're missing this property, it means no DS checks were made
  // because it's disabled
  const directSchedulingEnabled = isDirectSchedulingEnabled(eligibilityData);

  let eligibilityChecks = {
    requestSupported: eligibilityData.requestSupported,
    requestFailed: hasRequestFailed(eligibilityData),
    directSupported: eligibilityData.directSupported,
    directFailed: hasDirectFailed(eligibilityData),
  };

  if (!eligibilityChecks.requestFailed) {
    eligibilityChecks = {
      ...eligibilityChecks,
      requestPastVisit: hasVisitedInPastMonthsRequest(eligibilityData),
      requestPastVisitValue: eligibilityData.requestPastVisit.durationInMonths,
      requestLimit: isUnderRequestLimit(eligibilityData),
      requestLimitValue: eligibilityData.requestLimits.requestLimit,
    };
  }

  if (!eligibilityChecks.directFailed) {
    eligibilityChecks = {
      ...eligibilityChecks,
      directPastVisit:
        directSchedulingEnabled &&
        hasVisitedInPastMonthsDirect(eligibilityData),
      directPastVisitValue:
        directSchedulingEnabled &&
        eligibilityData.directPastVisit.durationInMonths,
      directPACT:
        directSchedulingEnabled &&
        hasPACTeamIfPrimaryCare(eligibilityData, typeOfCareId, systemId),
      directClinics:
        directSchedulingEnabled && !!eligibilityData.clinics.length,
    };
  }

  return eligibilityChecks;
}

export function isEligible(eligibilityChecks) {
  if (!eligibilityChecks) {
    return {
      direct: null,
      request: null,
    };
  }

  const {
    directFailed,
    directSupported,
    directPastVisit,
    directClinics,
    directPACT,
    requestFailed,
    requestSupported,
    requestLimit,
    requestPastVisit,
  } = eligibilityChecks;

  return {
    direct:
      !directFailed &&
      directSupported &&
      directPastVisit &&
      directPACT &&
      directClinics,
    request:
      !requestFailed && requestSupported && requestLimit && requestPastVisit,
  };
}

export function getEligibleFacilities(facilities) {
  return facilities.filter(
    facility => facility.requestSupported || facility.directSchedulingSupported,
  );
}

/**
 * Record Google Analytics events based on results of eligibility checks.
 * Error keys ending with 'error' represent a failure in fetching info for the check,
 * while keys ending with 'failure' signify that the user didn't meet the condition
 * of the check.
 */
export function recordEligibilityGAEvents(
  eligibilityData,
  typeOfCareId,
  systemId,
) {
  if (!hasRequestFailed(eligibilityData)) {
    if (!isUnderRequestLimit(eligibilityData)) {
      recordVaosError('request-exceeded-outstanding-requests-failure');
    }

    if (!hasVisitedInPastMonthsRequest(eligibilityData)) {
      recordVaosError('request-past-visits-failure');
    }
  }

  const directSchedulingEnabled = isDirectSchedulingEnabled(eligibilityData);

  if (directSchedulingEnabled && !hasRequestFailed(eligibilityData)) {
    if (!hasVisitedInPastMonthsDirect(eligibilityData)) {
      recordVaosError('direct-check-past-visits-failure');
    }

    if (!eligibilityData.clinics?.length) {
      recordVaosError('direct-available-clinics-failure');
    }

    if (
      typeOfCareId === PRIMARY_CARE &&
      !hasPACTeamIfPrimaryCare(eligibilityData, typeOfCareId, systemId)
    ) {
      recordVaosError('direct-pac-team-failure');
    }

    if (
      typeOfCareId === PRIMARY_CARE &&
      !hasPACTeamIfPrimaryCare(eligibilityData, typeOfCareId, systemId) &&
      eligibilityData.clinics?.length
    ) {
      Sentry.captureMessage('vaos_clinics_with_no_pact');
    }
  }
}
