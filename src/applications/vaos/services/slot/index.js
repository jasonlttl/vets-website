/*
 * Functions in here should map a var-resources API request to a similar response from
 * a FHIR resource request
 */
import { getAvailableSlots } from '../../api';
import { fhirSearch, mapToFHIRErrors } from '../utils';
import { transformSlots } from './transformers';
import { generateMockFHIRSlots } from '../../utils/calendar';

/*
 * This is used to parse the fake FHIR ids we create for organizations
 */
function parseId(id) {
  return id.replace('var', '');
}
/**
 * Fetch appointment slots based on start/end date times based on a VistA sites
 * availability for a particular type of care
 *
 * @param {Object} slotsRequest - An object containing the parameters necessary to retrive appointment slots
 * @param {string} slotsRequest.siteId 3 digit facility ID
 * @param {string} slotsRequest.typeOfCareId 3 digit type of care id
 * @param {string} slotsRequest.clinicId clinic id
 * @param {string} slotsRequest.startDate start date to search for appointments lots formatted as YYYY-MM-DD
 * @param {string} slotsRequest.endDate end date to search for appointments lots formatted as YYYY-MM-DD
 * @returns {Array} A FHIR searchset of Slot resources
 */
export async function getSlots({
  siteId,
  typeOfCareId,
  clinicId,
  startDate,
  endDate,
  useVSP,
}) {
  if (useVSP) {
    return fhirSearch({
      query: `Slot?schedule.actor=HealthcareService/${clinicId}&start=lt${endDate}&start=ge${startDate}`,
      mock: async () => {
        const mod = await import('./mock_slots.json');
        const slotData = mod.default ? mod.default : mod;
        slotData.entry = generateMockFHIRSlots();
        return slotData;
      },
    });
  } else {
    try {
      const data = await getAvailableSlots(
        parseId(siteId),
        typeOfCareId,
        clinicId.split('_')[1],
        startDate,
        endDate,
      );

      return transformSlots(data[0]?.appointmentTimeSlot || []);
    } catch (e) {
      if (e.errors) {
        throw mapToFHIRErrors(e.errors);
      }

      throw e;
    }
  }
}
